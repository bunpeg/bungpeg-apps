export function resolveFileNameFromUrl(fileUrl: string) {
  const urlSegments = fileUrl.split('/');
  const file = urlSegments[urlSegments.length - 1]!;
  const fileSegments = file.split('-').slice(0, -1);
  const [_f, extension] = file.split('.');
  const cleanName = fileSegments.join('-').replace(/%20/g, ' ');

  return `${cleanName}.${extension}`;
}

export function removeSpecialCharacters(str: string, replaceWith = ''): string {
  return str.replace(/[^\w\s]/g, replaceWith); // \w = [a-zA-Z0-9_], \s = space
}

export function toKebabCase(str: string) {
  return str.split(' ').map(part => part.toLowerCase()).join('-');
}

export function buildSlug(str: string) {
  return toKebabCase(removeSpecialCharacters(str, ' '));
}
