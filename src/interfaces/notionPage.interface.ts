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
  | "numbered_list_item"
  | "to_do"
  | "quote"
  | "bookmark"
  | "code"
  | "divider"
  | "embed"
  | "child_page"
  | "image"
  | "video"
  | "file"
  | "table"
  | "column_list"
  | "column"
  | "toggle"
  | "callout";

// Bloque base
export interface BaseBlock {
  id: string;
  type: BlockType;
  // Bloques anidados (toggle, callout, listas con hijos, etc.)
  children?: NotionBlock[];
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

export interface NumberedListItemBlock extends BaseBlock {
  type: "numbered_list_item";
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

/**
 * Bloque multimedia. `url` es la URL de Notion, que en los ficheros subidos a
 * Notion caduca (~1 h). `proxy_url` es una ruta estable de esta API que sirve
 * el fichero siempre actualizado y cacheable, y es la que deben usar los
 * clientes.
 */
export interface MediaBlock extends BaseBlock {
  type: "image" | "video" | "file";
  url: string;
  proxy_url: string;
  caption: RichTextItem[];
}

export interface ImageBlock extends MediaBlock {
  type: "image";
}

export interface VideoBlock extends MediaBlock {
  type: "video";
}

export interface FileBlock extends MediaBlock {
  type: "file";
}

// Celdas de una fila: una lista de rich_text por columna
export interface TableRowData {
  id: string;
  cells: RichTextItem[][];
}

export interface TableBlock extends BaseBlock {
  type: "table";
  table_width: number;
  has_column_header: boolean;
  has_row_header: boolean;
  rows: TableRowData[];
}

export interface ColumnBlock extends BaseBlock {
  type: "column";
  width_ratio: number;
  blocks: NotionBlock[];
}

export interface ColumnListBlock extends BaseBlock {
  type: "column_list";
  columns: ColumnBlock[];
}

export interface ToggleBlock extends BaseBlock {
  type: "toggle";
  rich_text: RichTextItem[];
  color: string;
}

export interface CalloutBlock extends BaseBlock {
  type: "callout";
  rich_text: RichTextItem[];
  icon: string;
  color: string;
}

// Unión de todos los tipos de bloques
export type NotionBlock =
  | ParagraphBlock
  | Heading1Block
  | Heading2Block
  | Heading3Block
  | BulletedListItemBlock
  | NumberedListItemBlock
  | ToDoBlock
  | QuoteBlock
  | BookmarkBlock
  | CodeBlock
  | DividerBlock
  | EmbedBlock
  | ChildPageBlock
  | ImageBlock
  | VideoBlock
  | FileBlock
  | TableBlock
  | ColumnListBlock
  | ColumnBlock
  | ToggleBlock
  | CalloutBlock;

// Respuesta del endpoint
export interface NotionPageResponse {
  current_page_title: string;
  blocks: NotionBlock[];
}
