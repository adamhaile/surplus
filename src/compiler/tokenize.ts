import { Params } from './compile';

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
/// $
/// //
/// \n
/// /*
/// */
/// misc (any string not containing one of the above)

// pre-compiled regular expressions
const tokensRx = /<\/?(?=\w)|\/?>|<!--|-->|=|\{\.\.\.|\)|\(|\[|\]|\{|\}|"|'|`|\$|\/\/|\n|\/\*|\*\/|(?:[^<>=\/()[\]{}"'`$\n*-]|(?!-->)-|\/(?![>/*])|\*(?!\/)|(?!<\/?\w|<!--)<\/?)+/g;
//                |          |    |    |   +- =
//                |          |    |    +- -->
//                |          |    +- <!--
//                |          +- /> or >
//                +- < or </ followed by \w

export function tokenize(str : string, opts : Params) {
    var toks = str.match(tokensRx);

    return toks || [];
}
