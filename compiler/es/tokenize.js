/// tokens:
/// < (followed by \w)
/// </ (followed by \w))
/// >
/// />
/// <!--
/// -->
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
/// `
/// ${
/// //
/// \n
/// /*
/// */
/// misc (any string not containing one of the above)
// pre-compiled regular expressions
var tokensRx = /<\/?(?=\w)|\/?>|<!--|-->|=|\{\.\.\.|\)|\(|\[|\]|\{|\}|"|'|`|\$\{|\/\/|\n|\/\*|\*\/|(?:[^<>=\/()[\]{}"'`$\n*-]|(?!-->)-|\/(?![>/*])|\*(?!\/)|(?!<\/?\w|<!--)<\/?|\$(?!\{))+/g;
//                |          |    |    |   +- =
//                |          |    |    +- -->
//                |          |    +- <!--
//                |          +- /> or >
//                +- < or </ followed by \w
export function tokenize(str, opts) {
    var toks = str.match(tokensRx);
    return toks || [];
}
