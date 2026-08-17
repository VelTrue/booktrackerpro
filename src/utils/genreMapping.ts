import { GENRES, type Genre } from '../constants/genres'

// Google Books возвращает категории в стиле BISAC ("Fiction / Fantasy / Epic"),
// поэтому сопоставляем по ключевым словам, от более специфичных к общим.
const KEYWORD_RULES: [RegExp, Genre][] = [
  [/historical fiction|исторический роман/i, 'Исторический роман'],
  [/fantasy|фэнтези|фентези/i, 'Фэнтези'],
  [/science fiction|sci-?fi|научная фантастика/i, 'Научная фантастика'],
  [/mystery|detective|crime|детектив/i, 'Детектив'],
  [/romance|love stories|любовный роман/i, 'Любовный роман'],
  [/thriller|suspense|триллер/i, 'Триллер'],
  [/poetry|поэзия/i, 'Поэзия'],
  [/satire|humor|humour|сатира/i, 'Сатира'],
  [/adventure|приключения/i, 'Прикл-ния'],
  [/biography|autobiography|memoir|автофикшен/i, 'Автофикшен'],
  [/short stories|рассказ/i, 'Рассказ'],
  [/novella|повесть/i, 'Повесть'],
  [
    /self-help|business|philosophy|psychology|non-?fiction|science(?!\s*fiction)|нон-фикшн|нонфикшн/i,
    'Нон-фикшн',
  ],
  [/fiction|роман/i, 'Роман'],
]

export function mapCategoriesToGenres(rawCategories: string[]): Genre[] {
  const found: Genre[] = []

  for (const category of rawCategories) {
    const match = KEYWORD_RULES.find(([pattern]) => pattern.test(category))
    if (match && !found.includes(match[1])) {
      found.push(match[1])
    }
    if (found.length >= 2) break
  }

  return found
}

export function isKnownGenre(value: string): value is Genre {
  return (GENRES as readonly string[]).includes(value)
}
