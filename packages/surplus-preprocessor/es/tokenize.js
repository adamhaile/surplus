/// tokens:
/// < (followed by \w)
/// </ (followed by \w))
/// >
/// />
/// <!--
/// -->
/// @
/// =
/// {...
/// )
/// (
/// [
/// ]
/// {
/// }
/// "
/// '
/// //
/// \n
/// /*
/// */
/// misc (any string not containing one of the above)
// pre-compiled regular expressions
var rx = {
    tokens: /<\/?(?=\w)|\/?>|<!--|-->|@|=|\{\.\.\.|\)|\(|\[|\]|\{|\}|"|'|\/\/|\n|\/\*|\*\/|(?:[^<>@=\/@=()[\]{}"'\n*-]|(?!-->)-|\/(?![>/*])|\*(?!\/)|(?!<\/?\w|<!--)<\/?)+/g,
};
export function tokenize(str, opts) {
    var toks = str.match(rx.tokens);
    return toks || [];
}
