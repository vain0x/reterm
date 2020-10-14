
export type JobRequest = void

// stmt = if | while | for | job

// job = (raw '=' word ws)* (redirect ws)* (word ws)* (redirect ws)* (';' | '&')? ('|') ...
// word = (single_quote | double_quote | raw | escape | subst | subquery)*
// raw = [^'"\\()$!<>;&|{}]*
// single_quote = '\'' char* '\''
// double_quote = '"' (escape | subst | char)* '"'
// subst = '$' raw | '$' '{ raw ws (':-' ws value)? ws '}'
// redirect = '<& int | '>&' int | '<' word | '>' word | '>>' word | '<(' ws  ')' | '>(' ws ')'
// subquery = '$(' ... ')' | '(' job ')' | '`' job '`'
// ws = [ \t]*
export const parse = (text: string): JobRequest => {
  text = text.trim()
}
