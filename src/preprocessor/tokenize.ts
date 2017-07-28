import { Params } from './preprocess';

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
/// //
/// \n
/// /*
/// */
/// misc (any string not containing one of the above)

// pre-compiled regular expressions
const rx = {
    tokens: /<\/?(?=\w)|\/?>|<!--|-->|=|\{\.\.\.|\)|\(|\[|\]|\{|\}|"|'|\/\/|\n|\/\*|\*\/|(?:[^<>@=\/@=()[\]{}"'\n*-]|(?!-->)-|\/(?![>/*])|\*(?!\/)|(?!<\/?\w|<!--)<\/?)+/g,
    //       |          |    |    |   +- =
    //       |          |    |    +- -->
    //       |          |    +- <!--
    //       |          +- /> or >
    //       +- < or </ followed by \w
};

export function tokenize(str : string, opts : Params) {
    var toks = str.match(rx.tokens);

    return toks || [];
}
