/*
 * TODO: Move types to more appropriate files. (e.g.: Maybe Segment goes to utils)
 * Currently they live here because this is the only file initially being given type information to keep the
 * blast radius of changes in on commit smaller.
 */

export interface Segment {
	startPosition?: number;
	endPosition?: number;
	name?: string;
	color?: string;
	user?: User;
	spaceId?: string;
	spaceUrl?: string;
	cardId?: string;
	userId?: string;
	tag?: string;
	isTag?: boolean;
	link?: string;
	isLink?: boolean;
	file?: string;
	isFile?: boolean;
	command?: string;
	isCommand?: boolean;
	url?: string;
	isAtUserMention?: boolean;
	isInviteLink?: boolean;
	isImage?: boolean;
	collaboratorKey?: string;
}

export interface CardSnapGuides {
	any: side;
	any: origin;
	any: target;
}

export interface Position {
	x: number;
	y: number;
	width: number;
	height: number;
}

export interface CardList {
	id: string;
	x: number;
	y: number;
	resizeWidth?: number;
}

export interface Card {
	id: string;
	createdAt: Date;
	updatedAt: Date;
	listId: string|null;
	linkToCardId: string;
	linkToSpaceId: string;
	linkToSpaceCollaboratorKey: string;
	name: string;
	nameSegments: Segment[];
	nameUpdatedAt: Date;
	nameUpdatedByUserId: string;
	listPositionIndex: string|null;
	position: Position;
	headerFontId: number;
	headerFontSize: string;
	x: number;
	y: number;
	z: number;
	width: number | null;
	height: number;
	prevWidth: number;
	prevHeight: number;
	maxWidth: number;
	tilt: number;
	xDisplay: number;
	yDisplay: number;
	resizeWidth: number|null;
	backgroundColor: string|null;
	frameId: number;
	user: User;
	userId: string;
	spaceId: string;
	headerFontId: number;
	urlIsHidden: boolean;
	urlIsVisible: boolean;
	urlPreviewIsVisible: boolean;
	urlPreviewDescription: string;
	urlPreviewErrorUrl: string;
	urlPreviewFavicon: string;
	urlPreviewImage: string;
	urlPreviewTitle: string;
	urlPreviewUrl: string;
	urlPreviewEmbedHtml: string;
	urlPreviewIframeUrl: string;
	isParentCard: boolean;
	isLocked: boolean;
	isRemoved: boolean;
	isComment: boolean;
	isTodo: boolean;
	isFromBroadcast: boolean;
	isCreatedThroughPublicApi: boolean;
	videoIsPaused: boolean;
	shouldHideUrlPreviewImage: boolean;
	shouldHideUrlPreviewInfo: boolean;
	shouldUpdateUrlPreview: boolean;
	shouldShowOtherSpacePreviewImage: boolean;
	shouldSnapAlignToXDisplay: boolean;
	shouldSnapAlignToYDisplay: boolean;
	atUserMentions: any[];
	atDateMentions: any[];
	codeBlockLanguage: string;
	counterIsVisible: boolean;
	counterValue: number;
}

export type CardUpdate = Partial<Card>;

export type CardStoreState = {
	byId: Object<string, Card>;
	allIds: string[];
	cardSnapGuides: SnapGuide[];
}

export interface User {
	id: string;
}

export interface SnapGuide {
	side: "top" | "bottom";
	item: Card;
	target: Card;
	time: number;
	distance: number;
	sizeOutside: number;
}