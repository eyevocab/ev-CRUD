
import { useState } from 'react';
import { ICreatorUIProps } from '../../pages/ux/creator/creator.ui';
import { TLanguage, TPartOfSpeech } from '../../../api/entities/vocab/vocab.interface';
import styles from './Creator.module.scss';
import { Collection, Vocab } from '../../../api'; 

function shouldRenderMedia(m: Vocab.GetMedia) {
    if(m == null) return false;
    if(m.image == null || m.sound == null) return false;
    return true;
}

function bufferToString(buff: Buffer, fileType: string) {
    if(buff == null) return null;
    const encoding = Buffer.from(buff).toString('base64');
    return `data:${fileType};base64,${encoding}`;
}

const CollectionView = ({stateManager, set, creatorManager, setCreator}: ICreatorUIProps) => {
    const [targetCollection, setTargetCollection] = useState<Collection.Get>(null);
    const [targetVocab, setTargetVocab] = useState<Vocab.Get>(null);
    const [targetVocabMedia, setTargetMedia] = useState<Vocab.GetMedia>(null);
    console.log('COLLECTION DATA CHECK\n', stateManager.creator.data.vocab.read);

    function getVocabByID(id: string): Vocab.Get {
        const v = stateManager.creator.data.vocab.read.find(vocab => vocab.id == id);
        return v;
    }

    function getVocabMediaByID(id: string): Vocab.GetMedia {
        const v: Vocab.Get = getVocabByID(id);
        stateManager.creator.data.vocab.media.refresh().then();
        const media = stateManager.creator.data.vocab.media.read;
        console.log(media);
        const m = media.find(m => {
            m && m.id == v.storagekey
        });
        const no_result: Vocab.GetMedia = {
            creator: null,
            vocab: null,
            id: '',
            image: null,
            sound: null,
            description: ''
        };
        return m != null ? m : no_result;
    }

    return (
    <div id={styles.CollectionViewer}>
        <div id={styles.CollectionList}>
            {Object.entries(stateManager.creator.data.collections.read).map(([i, c]) => { return (
            <div key={c.id} className={styles.CollectionListWrapper} >
                <p>{c.lang.slice(0, 3).toUpperCase()}</p>
                <button onClick={(e) => {setTargetCollection(c)}}>
                    <h1>{c.name}</h1>
                </button>
            </div>
            )})}
        </div>

        <div id={styles.CollectionDataView}>
            {targetCollection != null &&
            <div id={styles.CollectionText}>
                <div style={{paddingBottom: '5vh', fontSize: '2em'}}>
                    <h1>{targetCollection.name}</h1>
                </div>
                <div>
                    <p>ID</p>
                    <p>{targetCollection.id}</p>
                </div>

                <div>
                    <p>creator</p>
                    <p>{targetCollection.creator.id}</p>
                </div>
                
                <div>
                    <p>lang</p>
                    <p>{targetCollection.lang}</p>
                </div>
                
                <div>
                    <p>name</p>
                    <p>{targetCollection.name}</p>
                </div>
                
                <div id={styles.CollectionItemsView}>
                    <div style={{paddingBottom: '1vh'}}>
                        <h2>Collection Items</h2>
                    </div>
                    <div id={styles.CollectionItemsWrapper}>
                        {targetCollection.items.map((v, i) => {
                            return(
                                <div key={v.id} style={{backgroundImage: bufferToString(getVocabMediaByID(v.id).image, 'image')}}>
                                    <p>{getVocabByID(v.id).value}</p>
                                    {/* {shouldRenderMedia(getVocabMediaByID(v.id)) &&
                                        <div style={{backgroundImage: bufferToString(getVocabMediaByID(v.id).image, 'image')}}>
                                            {getVocabByID(v.id).value}
                                        </div>
                                    } */}
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>}
        </div>
    </div>);
}

export default CollectionView;
