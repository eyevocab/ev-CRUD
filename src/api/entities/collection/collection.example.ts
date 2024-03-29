// an example collection. not to be used in production

import { VocabExample } from '../vocab';
import { CreatorExample } from '../users/creator/creator.example';
import { ICollection } from './collection.interface';
import { TLanguage } from '../vocab/vocab.interface';

export const CollectionExample: ICollection = {
    creator: CreatorExample,
    items: [VocabExample, VocabExample, VocabExample],
    id: 'collection-example',
    lang: 'english' as TLanguage,
    description: '',
    name: 'early early collection example'
}
