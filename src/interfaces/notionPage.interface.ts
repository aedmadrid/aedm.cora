// Interfaz para texto enriquecido
export interface RichTextItem {
  plain_text: string;
  href: string | null;
  annotations: {
    bold: boolean;
    italic: boolean;
    underline: boolean;
    strikethrough: boolean;
    color: string;
  };
}

// Tipos de bloques soportados
export type BlockType =
  | "paragraph"
  | "heading_1"
  | "heading_2"
  | "heading_3"
  | "bulleted_list_item"
  | "to_do"
  | "quote"
  | "bookmark"
  | "code"
  | "divider"
  | "embed"
  | "child_page"
  | "image";

// Bloque base
export interface BaseBlock {
  id: string;
  type: BlockType;
}

// Bloques específicos
export interface ParagraphBlock extends BaseBlock {
  type: "paragraph";
  rich_text: RichTextItem[];
}

export interface Heading1Block extends BaseBlock {
  type: "heading_1";
  rich_text: RichTextItem[];
}

export interface Heading2Block extends BaseBlock {
  type: "heading_2";
  rich_text: RichTextItem[];
}

export interface Heading3Block extends BaseBlock {
  type: "heading_3";
  rich_text: RichTextItem[];
}

export interface BulletedListItemBlock extends BaseBlock {
  type: "bulleted_list_item";
  rich_text: RichTextItem[];
}

export interface ToDoBlock extends BaseBlock {
  type: "to_do";
  rich_text: RichTextItem[];
  checked: boolean;
}

export interface QuoteBlock extends BaseBlock {
  type: "quote";
  rich_text: RichTextItem[];
}

export interface BookmarkBlock extends BaseBlock {
  type: "bookmark";
  url: string;
}

export interface CodeBlock extends BaseBlock {
  type: "code";
  rich_text: RichTextItem[];
  language: string;
}

export interface DividerBlock extends BaseBlock {
  type: "divider";
}

export interface EmbedBlock extends BaseBlock {
  type: "embed";
  url: string;
}

export interface ChildPageBlock extends BaseBlock {
  type: "child_page";
  title: string;
}

export interface ImageBlock extends BaseBlock {
  type: "image";
  url: string;
  caption: RichTextItem[];
}

// Unión de todos los tipos de bloques
export type NotionBlock =
  | ParagraphBlock
  | Heading1Block
  | Heading2Block
  | Heading3Block
  | BulletedListItemBlock
  | ToDoBlock
  | QuoteBlock
  | BookmarkBlock
  | CodeBlock
  | DividerBlock
  | EmbedBlock
  | ChildPageBlock
  | ImageBlock;

// Respuesta del endpoint
export interface NotionPageResponse {
  current_page_title: string;
  blocks: NotionBlock[];
}
