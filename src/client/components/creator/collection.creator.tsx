// collection.editor.tsx
// this is the collection creation module for the creator UX
// this is where creator's create new collections to be posted into the database's collection table
// TODO: abstract support for the virtual keyboard into a tidy module

import { FormEvent, useState, useRef, useReducer } from 'react';
import { ICreatorUIProps } from '../../pages/ux/creator/creator.ui';
import { TLanguage, TPartOfSpeech, TVocabSubject } from '../../../api/entities/vocab/vocab.interface';
import "react-simple-keyboard/build/css/index.css";
import styles from './Creator.module.scss';
import { IEntity, Vocab, Collection } from '../../../api/entities/';
import Axios from 'axios';
import Keyboard, {SimpleKeyboard} from 'react-simple-keyboard';

// TODO dot env file
const HOST = 'http://localhost';
const PORT = '3000';

// all end points gets routed to:
//    src/server/db/collection/collection.controller.ts
const END_POINT = `${HOST}:${PORT}/api/db/collections`;

import * as KeyboardSupport from '../../../api/keyboard';
import { makeKeyboardDraggable } from '../../../api/keyboard'

function fileToURL(file:any) {
    if(file == null) return '';
    return URL.createObjectURL(file);
}

function bufferToString(buff: Buffer, fileType: string) {
    if(buff == null) return null;
    const encoding = Buffer.from(buff).toString('base64');
    return `data:${fileType};base64,${encoding}`;
}

// async function getAllVocabs(): Promise<Vocab.Get[]> {
//     try {
//         const res = await Axios.get(`${HOST}:${PORT}/api/db/vocab/all`);
//         const v: Vocab.Get[] = res.data as Vocab.Get[];
//         console.log(`found ${v.length} vocabs in the database!`);
//         return v;

//     } catch(err) {
//         alert('ERROR! could not retrieve all vocab items in the database')
//         console.log(err);
//     }
// }

const CollectionCreator = ({stateManager, set, creatorManager, setCreator}: ICreatorUIProps) => {
    const [, forceUpdate] = useReducer(x => x + 1, 0);
    const [collectionDescription, setCollectionDescription] = useState<string>('');
    const [language, setLanguage] = useState<TLanguage>('english');
    const [showKeyboard, setShowKeyboard] = useState(false);
    const [vocabItems, setVocabItems] = useState<Vocab.Get[]>([]);
    const [useLangFilter, setUseLangFilter] = useState(false);

    function isInVocabItems(vocab: Vocab.Get): boolean {
        if(vocabItems.find(v => { return v.id == vocab.id })) {
            // console.log(vocabItems, 'contains', vocab.id);
            return true;
        } else {
            // console.log(vocabItems, 'does not contain', vocab.id);
            return false;
        }
    }

    function addVocabToItems(vocab: Vocab.Get) {
        if(isInVocabItems(vocab)) return;
        setVocabItems([...vocabItems, vocab]);
        forceUpdate();
    }

    function removeVocabFromItems(vocab: Vocab.Get) {
        if(!isInVocabItems(vocab)) return;
        setVocabItems((prev) => {
            const idx = prev.findIndex((v) => v.id == vocab.id);
            const removed = prev.splice(idx, 1)[0];
            console.log(`removed ${removed.id}`)
            return prev;
        });
        forceUpdate();
    }

    const draggableKeyboardMenu = useRef(null);
    const draggableHeader = useRef(null);
    const keyboard = useRef<SimpleKeyboard>(null);
    const keyboardInput = useRef(null);    
    const descriptionInput = useRef(null);
    const nameInput = useRef(null);
    const [layoutName, setLayoutName] = useState("default"); // for shift, caps lock, etc

    const [keyboardShift, setKeyboardShift] = useState(false);
    const [keyboardLock, setKeyboardLock] = useState(false);
    const onKeyboardPress = button => {
        console.log("Button pressed", button);

        if(button == '{lock}') {
            // set caps lock
            if(!keyboardLock) {
                setLayoutName('shift');
                setKeyboardLock(true);
                keyboard.current.addButtonTheme('{lock}', styles.LockActive);
            }
            // turn off caps lock
            else {
                setLayoutName('default');
                setKeyboardLock(false);
                keyboard.current.removeButtonTheme('{lock}', styles.LockActive);
            }

            if(keyboardShift) {
                setKeyboardShift(false);
                keyboard.current.removeButtonTheme('{shift}', styles.ShiftActive);
            }
        } else if (button == '{shift}') {
            // the caps lock is on
            if(keyboardLock) {
                setLayoutName('shift');
            }

            // shift is off (turn on)
            else if(!keyboardShift) {
                setLayoutName('shift');
                setKeyboardShift(true);
                keyboard.current.addButtonTheme('{shift}', styles.ShiftActive);
            }

            // shift is on (turn off)
            else if(keyboardShift) {
                setLayoutName('default');
                setKeyboardShift(false);
                keyboard.current.removeButtonTheme('{shift}', styles.ShiftActive);
            }
        } else {
            // shift was set now clear it for the next input 
            if(keyboardShift) {
                setLayoutName('default');
                setKeyboardShift(false);
                keyboard.current.removeButtonTheme('{shift}', styles.ShiftActive);
            }
        }
    };

    const submitCollectionPutRequest = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        console.log('COLLECTION.PUT REQUEST BEGIN');
        // retrieve put data
        const creator: IEntity = {id: stateManager.user.read.id };
        const lang = e.target['Lang'].value as TLanguage;
        const name = e.target['Name'].value;
        const note = collectionDescription;

        const id = `${creator.id}-${name}-${lang}`;

        // TODO validate data
        if(name == '') {
            alert('collection name cannot be empty!');
            return;
        } else if(note == '') {
            alert('collection description cannot be empty!');
            return;
        }

        // create payloads
        const collectionPayload: Collection.Put = {
            name: name,
            creator: creator,
            items: vocabItems,
            lang: lang,
            id: id,
            description: note
        }

        // sanity check
        console.log('COLLECTION.PUT REQUEST ON CLIENT\n', collectionPayload);
    
        // submit collection data
        // all end points gets routed to:
        //    src/server/db/collection/collection.controller.ts
        try {
            console.log('sending collection...');
            const result = await Axios.put(`${END_POINT}/new`, { body: collectionPayload });
            console.log(result);
        } catch(err) {
            alert('error! could not create vocab');
            console.log(err);
        }

        // update client state

        // reset the creator on success
        setCreator({...creatorManager, createCollection: {read: false}});
        set((prev) => {
            prev.user.isActive = false;
            return prev;
        });

        await stateManager.creator.refresh();
        await stateManager.creator.data.collections.refresh();
    }

    const processKeyboardInput = buffer => {
        if(keyboardInput.current == null) return;
        // console.log('BOOP', buffer);
        keyboardInput.current.value = buffer;
    }

    const focusKeyboardOn = r => {
        if(r == null || keyboard.current == null) return;
        if(keyboardInput.current != null) {
            keyboardInput.current.classList.remove(styles.ActiveInput);
        }
        
        keyboardInput.current = r;
        r.classList.add(styles.ActiveInput);
        keyboard.current.setInput(r.value);
    }

    return (
    <div id={styles.CollectionCreator}>
        <div id={styles.CollectionMenu}>
            {language != 'english' &&
            <div id={styles.KeyboardMenu} ref={draggableKeyboardMenu} >
                {showKeyboard &&
                <Keyboard
                    keyboardRef={r => {keyboard.current = r}}
                    layout={KeyboardSupport.LanguageLayouts[language]}
                    layoutName={layoutName}
                    onKeyPress={onKeyboardPress}
                    onChange={processKeyboardInput}
                /> && makeKeyboardDraggable(draggableKeyboardMenu.current, draggableHeader.current)}
                <div style={{width: '100%', display: 'flex', flexDirection: 'row'}}>
                    <div className={styles.UserButtonWrapper} style={{width: '50%'}}>
                        <button onClick={(e) => {
                            e.preventDefault();
                            setShowKeyboard((prev) => !prev);
                            if(!makeKeyboardDraggable(draggableKeyboardMenu.current, draggableHeader.current)) {
                                alert('oof!');
                            }
                            if(keyboardInput.current != null) {
                                keyboardInput.current.classList.remove(styles.ActiveInput);
                            }
                        }}>
                            {`toggle ${language} keyboard`}
                        </button>
                    </div>
                    
                    <div id={styles.KeyboardMoveGrabbableArea} style={{width: '50%'}}>
                        <div id={styles.GrabbableHeader} ref={draggableHeader}>
                            {showKeyboard && <p>Click & Drag to move</p>}
                        </div>
                    </div>
                </div>
            </div>}

            <form id={styles.Form} onSubmit={async (e) => {await submitCollectionPutRequest(e);}}>
                {/* vocab language */}
                <div>
                    <p>Language</p>
                    <select name='Lang' onChange={async (e)=> {
                        e.preventDefault();
                        keyboardInput.current = null;
                        setLanguage(e.target.value as TLanguage);
                    }}>
                        {KeyboardSupport.SupportedLanguages.map((lang) =>  <option key={lang}>{lang}</option>)}
                    </select>
                </div>

                {/* name of the collection */}
                <div>
                    <p>Name</p>
                    <input ref={nameInput} name='Name' placeholder='Name' onFocus={(e) => {
                        e.preventDefault();
                        focusKeyboardOn(nameInput.current);
                    }}/>
                </div>

                {/* description of the collection */}
                <div>
                    <textarea ref={descriptionInput} placeholder='description' onFocus={(e)=>{
                        e.preventDefault();
                        focusKeyboardOn(descriptionInput.current);
                    }} onChange={(e)=>{setCollectionDescription(e.target.value)}}></textarea>
                </div>

                {/* form submission */}
                <div>
                    <input type='Submit' placeholder='Create Vocab'/>
                </div>

                <div id={styles.LanguageFilterToggleWrapper}>
                    <p>Use Language Filter?</p>
                    <label className={styles.switch}>
                        <input type="checkbox" onChange={(e) => {
                            setUseLangFilter(e.target.checked);
                        }} onClick={(e) => {
                            setUseLangFilter(prev => !prev);
                        }} />
                        <span className={styles.slider}></span>
                    </label>
                </div>
            </form>

        </div>

        <div id={styles.CollectionItemsWrapper}>
            {stateManager.creator.data.vocab.read.map((v, i)=> {
            if(isInVocabItems(v)) return
            if(useLangFilter && v.lang != language) return;

            const media = stateManager.creator.data.vocab.media.read[i];
            let imageURL: string = '';
            if(media != null && media.image != null) {
                // console.log(`VOCAB.MEDIA CHECK ${v.id}`, media);
                imageURL = bufferToString(media.image, 'image');
                // console.log(imageURL, '\n^^^^\n')
            }
            return (
            <div className={v.id} key={v.id} style={{
                backgroundImage: `url(${imageURL})`,
                display: 'flex',
                flexDirection: 'column'
            }}>
                <div style={{
                    display: 'flex',
                    width: '25vw',
                    flexDirection: 'row'
                }}>
                    {<button style={{
                        display: 'flex',
                        borderRadius: '20px',
                        backgroundColor: 'lightgreen',
                        border: 'none',
                        textAlign: 'center'
                    }} onClick={(e)=>{
                        e.preventDefault();
                        console.log(`ADDING ${v.id}`);
                        addVocabToItems(v);
                    }}>Add</button>}
                </div>
                <div className={styles.VocabText} style={{
                    display: 'flex',
                    flexDirection: 'row',
                    width: '25vw',
                    textAlign: 'center'
                }} >
                    <p style={{
                        display: 'flex',
                        width: '50%',
                        background: `rgba(0,0,0,0.8)`,
                        textAlign: `center`,
                        borderRadius: `20px`
                    }}> {v.lang.slice(0, 3).toUpperCase()} </p>
                    <p style={{
                        display: 'flex',
                        width: '50%',
                        background: `rgba(0,0,0,0.8)`,
                        textAlign: `center`,
                        borderRadius: `20px`
                    }}> {v.value} </p>
                </div>
            </div>
            )})}
        </div>

        <div id={styles.CollectionItemsSelection}>
            <h1>{`${vocabItems.length} vocab selected`}</h1>
            <div>
                {vocabItems.map( v => {return(
                    <div key={v.id}>
                        <p>{v.value}</p>
                        {<button onClick={(e)=>{
                            e.preventDefault();
                            console.log(`REMOVING ${v.id}`);
                            removeVocabFromItems(v);
                        }}>Remove</button>}
                    </div>
                )})}
            </div>
        </div>
    </div>);
}

export default CollectionCreator;
