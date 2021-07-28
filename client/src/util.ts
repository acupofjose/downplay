export const splitter = (str: string, length: number) => {
  var strs = []
  while (str.length > length) {
    var pos = str.substring(0, length).lastIndexOf(" ")
    pos = pos <= 0 ? length : pos
    strs.push(str.substring(0, pos))
    var i = str.indexOf(" ", pos) + 1
    if (i < pos || i > pos + length) i = pos
    str = str.substring(i)
  }
  strs.push(str)
  return strs
}
