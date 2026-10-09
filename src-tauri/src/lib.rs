use std::sync::atomic::{AtomicUsize, Ordering};
use tauri::menu::{IsMenuItem, Menu, MenuItem, PredefinedMenuItem, Submenu};
use tauri::utils::config::{FrontendDist, WebviewUrl};
use tauri::webview::{NewWindowResponse, PageLoadEvent};
use tauri::{AppHandle, Manager, Url, WebviewWindow, WebviewWindowBuilder};
use tauri_plugin_opener::OpenerExt;

const APP_HOSTS: [&str; 2] = ["kinopio.club", "kinopio.local"];
// external pages that the app redirects to and back from, they stay in the app
const IN_APP_HOSTS: [&str; 2] = ["checkout.stripe.com", "billing.stripe.com"];
const MAIN_WINDOW_LABEL: &str = "main";
const TABBING_IDENTIFIER: &str = "kinopio";
const NEW_TAB_MENU_ID: &str = "new-tab";
const RELOAD_MENU_ID: &str = "reload";
const BACK_MENU_ID: &str = "back";
const FORWARD_MENU_ID: &str = "forward";
const WEB_INSPECTOR_MENU_ID: &str = "web-inspector";

static TAB_COUNT: AtomicUsize = AtomicUsize::new(0);

fn is_web_url(url: &Url) -> bool {
  url.scheme() == "http" || url.scheme() == "https"
}

fn host_is_in(url: &Url, hosts: &[&str]) -> bool {
  match url.host_str() {
    Some(host) => hosts.contains(&host),
    None => false,
  }
}

fn is_app_url(url: &Url) -> bool {
  is_web_url(url) && host_is_in(url, &APP_HOSTS)
}

// external web pages that should be opened in the system browser
fn is_browser_url(url: &Url) -> bool {
  is_web_url(url) && !host_is_in(url, &APP_HOSTS) && !host_is_in(url, &IN_APP_HOSTS)
}

fn home_url(app: &AppHandle) -> Url {
  let build = &app.config().build;
  if tauri::is_dev() {
    if let Some(url) = &build.dev_url {
      return url.clone();
    }
  }
  if let Some(FrontendDist::Url(url)) = &build.frontend_dist {
    return url.clone();
  }
  Url::parse("https://kinopio.club").unwrap()
}

fn open_in_browser(app: &AppHandle, url: &Url) {
  log::info!("opening in browser {}", url);
  if let Err(error) = app.opener().open_url(url.as_str(), None::<&str>) {
    log::error!("could not open {} in browser {}", url, error);
  }
}

// window settings come from tauri.conf.json, windows are created here so that handlers can be attached
fn build_window(
  app: &AppHandle,
  label: &str,
  url: Option<Url>,
  visible: bool,
) -> tauri::Result<WebviewWindow> {
  let mut config = app.config().app.windows[0].clone();
  config.label = label.to_string();
  config.visible = visible;
  if let Some(url) = url {
    config.url = WebviewUrl::External(url);
  }
  let new_window_app = app.clone();
  let new_window_label = label.to_string();
  let page_load_app = app.clone();
  WebviewWindowBuilder::from_config(app, &config)?
    .tabbing_identifier(TABBING_IDENTIFIER)
    .initialization_script(include_str!("init.js"))
    .on_document_title_changed(|window, title| {
      if let Err(error) = window.set_title(&title) {
        log::error!("could not set window title {}", error);
      }
    })
    // window.open and target=_blank links
    .on_new_window(move |url, _features| {
      if is_app_url(&url) {
        open_tab(&new_window_app, url, new_window_label.clone());
      } else {
        open_in_browser(&new_window_app, &url);
      }
      NewWindowResponse::Deny
    })
    .on_page_load(move |window, payload| {
      let url = payload.url();
      if payload.event() == PageLoadEvent::Finished {
        log::info!("page loaded {} {}", window.label(), url);
        return;
      }
      // fallback for navigations that init.js can't see, like redirects.
      // on_navigation isn't used for this because it also fires for iframes
      if is_browser_url(url) {
        open_in_browser(&page_load_app, url);
        let home = serde_json::to_string(home_url(&page_load_app).as_str()).unwrap();
        let script = format!(
          "if (history.length > 1) {{ history.back() }} else {{ location.replace({}) }}",
          home
        );
        if let Err(error) = window.eval(script) {
          log::error!("could not return to app {}", error);
        }
      }
    })
    .build()
}

#[cfg(target_os = "macos")]
fn attach_as_tab(parent: &WebviewWindow, tab: &WebviewWindow) -> tauri::Result<()> {
  use objc2_app_kit::{NSWindow, NSWindowOrderingMode};
  let parent = parent.ns_window()? as *const NSWindow;
  let tab = tab.ns_window()? as *const NSWindow;
  // must be called on the main thread
  unsafe {
    (*parent).addTabbedWindow_ordered(&*tab, NSWindowOrderingMode::Above);
    (*tab).makeKeyAndOrderFront(None);
  }
  Ok(())
}

// opens url in a new tab of the parent window on macOS, and in a new window on other platforms
#[cfg_attr(not(target_os = "macos"), allow(unused_variables))]
fn open_tab(app: &AppHandle, url: Url, parent_label: String) {
  let app = app.clone();
  // windows can't be built from inside the handler that requested them, so build on another thread
  std::thread::spawn(move || {
    let count = TAB_COUNT.fetch_add(1, Ordering::Relaxed) + 1;
    let label = format!("tab-{}", count);
    // macOS tabs stay hidden until they're attached, so they don't flash as separate windows
    let visible = cfg!(not(target_os = "macos"));
    let window = match build_window(&app, &label, Some(url), visible) {
      Ok(window) => window,
      Err(error) => {
        log::error!("could not open tab {}", error);
        return;
      }
    };
    #[cfg(target_os = "macos")]
    {
      let main_thread_app = app.clone();
      let result = app.run_on_main_thread(move || {
        let mut is_attached = false;
        if let Some(parent) = main_thread_app.get_webview_window(&parent_label) {
          is_attached = attach_as_tab(&parent, &window).is_ok();
        }
        if !is_attached {
          let _ = window.show();
          let _ = window.set_focus();
        }
      });
      if let Err(error) = result {
        log::error!("could not attach tab {}", error);
      }
    }
  });
}

fn focused_window(app: &AppHandle) -> Option<WebviewWindow> {
  app
    .webview_windows()
    .into_values()
    .find(|window| window.is_focused().unwrap_or(false))
}

// new tab with the url of the current tab
fn open_tab_from_focused_window(app: &AppHandle) {
  let Some(window) = focused_window(app) else {
    return;
  };
  let mut url = home_url(app);
  if let Ok(current_url) = window.url() {
    if is_app_url(&current_url) {
      url = current_url;
    }
  }
  open_tab(app, url, window.label().to_string());
}

// default menu, plus File → New Tab, and View → Reload, Back, Forward, Web Inspector
fn build_menu(app: &AppHandle) -> tauri::Result<Menu<tauri::Wry>> {
  let menu = Menu::default(app)?;
  let new_tab = MenuItem::with_id(app, NEW_TAB_MENU_ID, "New Tab", true, Some("CmdOrCtrl+T"))?;
  let reload = MenuItem::with_id(app, RELOAD_MENU_ID, "Reload Page", true, Some("CmdOrCtrl+R"))?;
  let back = MenuItem::with_id(app, BACK_MENU_ID, "Back", true, Some("CmdOrCtrl+["))?;
  let forward = MenuItem::with_id(app, FORWARD_MENU_ID, "Forward", true, Some("CmdOrCtrl+]"))?;
  let web_inspector = MenuItem::with_id(
    app,
    WEB_INSPECTOR_MENU_ID,
    "Toggle Web Inspector",
    true,
    Some("CmdOrCtrl+Alt+I"),
  )?;
  let separator = PredefinedMenuItem::separator(app)?;
  let view_items: [&dyn IsMenuItem<tauri::Wry>; 5] =
    [&reload, &back, &forward, &separator, &web_inspector];
  let mut has_view_menu = false;
  for item in menu.items()? {
    let Some(submenu) = item.as_submenu() else {
      continue;
    };
    let text = submenu.text()?;
    if text == "File" {
      submenu.insert(&new_tab, 0)?;
    }
    // the default View menu only exists on macOS, where it has Enter Full Screen
    if text == "View" {
      submenu.insert(&PredefinedMenuItem::separator(app)?, 0)?;
      submenu.insert_items(&view_items, 0)?;
      has_view_menu = true;
    }
  }
  if !has_view_menu {
    menu.append(&Submenu::with_items(app, "View", true, &view_items)?)?;
  }
  Ok(menu)
}

fn eval_in_window(window: &WebviewWindow, script: &str) {
  if let Err(error) = window.eval(script) {
    log::error!("could not run {} {}", script, error);
  }
}

fn handle_menu_event(app: &AppHandle, id: &str) {
  if id == NEW_TAB_MENU_ID {
    open_tab_from_focused_window(app);
    return;
  }
  let Some(window) = focused_window(app) else {
    return;
  };
  if id == RELOAD_MENU_ID {
    if let Err(error) = window.reload() {
      log::error!("could not reload {}", error);
    }
  } else if id == BACK_MENU_ID {
    eval_in_window(&window, "history.back()");
  } else if id == FORWARD_MENU_ID {
    eval_in_window(&window, "history.forward()");
  } else if id == WEB_INSPECTOR_MENU_ID {
    if window.is_devtools_open() {
      window.close_devtools();
    } else {
      window.open_devtools();
    }
  }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .plugin(
      tauri_plugin_opener::Builder::new()
        // link clicks are handled by init.js instead
        .open_js_links_on_click(false)
        .build(),
    )
    .menu(build_menu)
    .on_menu_event(|app, event| handle_menu_event(app, event.id().as_ref()))
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }
      build_window(app.handle(), MAIN_WINDOW_LABEL, None, true)?;
      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while building tauri application");
}
