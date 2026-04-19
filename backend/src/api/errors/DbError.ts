export type DbError = {
  message: string
  code?: string
  constraint?: string
  table?: string
  detail?: string
  column?: string
}
