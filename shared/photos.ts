export const photoLimit = 12 * 1024 * 1024;

export type Photo = {
  id: string;
  name: string;
  note: string;
  added: string;
};

const subjects = [
  { title: 'Travel plans', match: /\b(trip|flight|hotel|itinerary|boarding|travel|vacation)\b/i },
  { title: 'Receipts & bills', match: /\b(receipt|invoice|bill|payment)\b/i },
  { title: 'Food & recipes', match: /\b(food|recipe|menu|dish|meal|restaurant)\b/i },
  { title: 'Cricket', match: /\b(cricket|wicket|ipl|odi)\b/i },
];

export function photoCollections(photos: Photo[]) {
  const themed = subjects.map(({ title, match }) => ({
    title,
    photos: photos.filter(({ name, note }) => match.test((name + ' ' + note).replace(/[_-]/g, ' '))),
  })).filter(collection => collection.photos.length);
  const batches = new Map<string, Photo[]>();
  const formatter = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' });
  for (const photo of photos) {
    const date = formatter.format(new Date(photo.added));
    const batch = batches.get(date) ?? [];
    batch.push(photo);
    batches.set(date, batch);
  }
  return [...themed, ...Array.from(batches, ([date, members]) => ({
    title: 'Added ' + date, photos: members,
  })).filter(batch => batch.photos.length >= 2)];
}
