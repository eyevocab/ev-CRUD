// vocab.creator.tsx
// this is the vocab creation module for the creator UX
// this is where creator's create new vocab items to be inserted into the database with an image and sound
// TODO: abstract support for the virtual keyboard into a tidy module

import { FormEvent, useState, useRef } from 'react';
import { ICreatorUIProps } from '../../pages/ux/creator/creator.ui';
import { TLanguage, TPartOfSpeech, TVocabSubject } from '../../../api/entities/vocab/vocab.interface';
import "react-simple-keyboard/build/css/index.css";
import styles from './Creator.module.scss';
import { IEntity, Vocab } from '../../../api/entities/';
import Axios from 'axios';
import Keyboard, {SimpleKeyboard} from 'react-simple-keyboard';

// TODO dot env file
const HOST = 'http://localhost';
const PORT = '3000';
// src/server/db/vocab/vocab.controller.ts
const END_POINT = `${HOST}:${PORT}/api/db/vocab`;

import * as KeyboardSupport from '../../../api/keyboard';
import { makeKeyboardDraggable } from '../../../api/keyboard';

// https://www.iana.org/assignments/media-types/media-types.xhtml#image
const SupportedImageTypes = 'image/png, image/jpeg, image/gif';

// https://www.iana.org/assignments/media-types/media-types.xhtml#audio
const SupportedSoundTypes = 'audio/mpeg';

function fileToURL(file:any) {
    if(file == null) return '';
    return URL.createObjectURL(file);
}

const VocabCreator = ({stateManager, set, creatorManager, setCreator}: ICreatorUIProps) => {

    const [imageDescription, setImageDescription] = useState<string>('');
    const [vocabNote, setVocabNote] = useState<string>('');
    const [image, setImage] = useState(null);
    const [sound, setSound] = useState(null);
    const [language, setLanguage] = useState<TLanguage>('english');
    const [showKeyboard, setShowKeyboard] = useState(false);
    
    
    const draggableKeyboardMenu = useRef(null);
    const draggableHeader = useRef(null);
    const keyboard = useRef<SimpleKeyboard>(null);
    const keyboardInput = useRef(null);
    const rootInput = useRef(null);
    const exampleInput = useRef(null);
    const noteInput = useRef(null);
    const descriptionInput = useRef(null);
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

    const submitVocabPutRequest = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        // console.log('state check\n', stateManager);

        // retrieve put data
        const creator: IEntity = {id: stateManager.user.read.id };
        const lang = e.target['Lang'].value as TLanguage;
        const value = e.target['Root'].value;
        const translation = e.target['Trans'].value;
        const example = e.target['Example'].value;
        const pos = e.target['POS'].value as TPartOfSpeech;
        const subject = e.target['Subject'].value as TVocabSubject; 
        const note = vocabNote;
        const description = imageDescription;
        const id = `${creator.id}-${value}-${translation}`;
        const storagekey = `${id}-media`;

        // TODO validate data
        if(image == null || sound == null) return;
        if(value == '' || translation == '') return;

        // create payloads
        const vocabPayload: Vocab.Put = {
            id: id,
            value: value,
            translation: translation,
            example: example,
            pos: pos,
            note: note,
            lang: lang,
            subject: subject,
            storagekey: storagekey,
            creator: creator
        }

        // create the multer formdata for the media upload
        let formData = new FormData();
        formData.append('image', image, `vocabID.${id}.storagekey.${storagekey}`);
        formData.append('sound', sound, `creatorID.${creator.id}.description.${description}`);
        // formData.append('id', id);
        // formData.append('description', description);
        // formData.append('creatorID', creator.id);

        // sanity check
        console.log('VOCAB.PUT REQUEST ON CLIENT\n', vocabPayload, formData);
    
        // submit vocab data
        // all end points gets routed to:
        //    src/server/db/vocab/vocab.controller.ts
        try {
            console.log('sending vocab...');
            const result = await Axios.put(`${END_POINT}/new`, { body: vocabPayload });
            console.log(result);
        } catch(err) {
            alert('error! could not create vocab');
            console.log(err);
        }
        // TODO submit media data
        try {
            console.log('sending vocab media...');
            const result = await Axios.put(`${END_POINT}/new/media`, formData, {
                headers: { "content-type": "multipart/form-data" }
            });
            console.log(result);
        } catch(err) {
            alert('error! could not create vocab media');
            console.log(err);
        }

        // TODO fix the refresh bug
        // potential solution: make the stateManger a state and pass the set function with it to the user interfaces
        // refresh the client state
        // console.log(stateManager.creator.data.vocab);
        console.log(stateManager);
        await stateManager.creator.data.vocab.refresh();
        await stateManager.creator.data.vocab.media.refresh();
        await stateManager.creator.refresh();

        // reset the creator on success
        // creatorManager.reset.create(); // TODO doesnt work .-.
        setCreator((prev) => {
            prev.createVocab.read = false;
            creatorManager.createVocab.read = false;
            return prev;
        });
        set((prev) => {
            prev.user.isActive = false;
            return prev;
        })
    }

    const processKeyboardInput = buffer => {
        if(keyboardInput.current == null) return
        console.log('KEYBOARD BUFFER', buffer);
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
    <div id={styles.VocabCreator}>
        <div id={styles.VocabMenu}>
            {language != 'english' &&
            <div id={styles.KeyboardMenu} ref={draggableKeyboardMenu} >
                {showKeyboard &&
                <Keyboard
                    keyboardRef={r => {keyboard.current = r}}
                    layout={KeyboardSupport.LanguageLayouts[language]}
                    layoutName={layoutName}
                    onKeyPress={onKeyboardPress}
                    onChange={processKeyboardInput}
                />}
                <div style={{width: '100%', display: 'flex', flexDirection: 'row'}}>
                    <div className={styles.UserButtonWrapper} style={{width: '50%'}}>
                        <button onClick={(e) => {
                            e.preventDefault();
                            setShowKeyboard((prev) => !prev);
                            makeKeyboardDraggable(draggableKeyboardMenu.current, draggableHeader.current);
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

            <form id={styles.Form} onSubmit={async (e) => {await submitVocabPutRequest(e)}}>
                {/* vocab language */}
                <div>
                    <p>Language</p>
                    <select name='Lang' onChange={async (e)=> {
                        e.preventDefault();
                        keyboardInput.current = null;
                        setLanguage(e.target.value as TLanguage);
                        makeKeyboardDraggable(draggableKeyboardMenu.current, draggableHeader.current)
                    }}>
                        {KeyboardSupport.SupportedLanguages.map((lang) =>  <option key={lang}>{lang}</option>)}
                    </select>
                </div>

                {/* root vocab value */}
                <div>
                    <p>Root Value</p>
                    <input ref={rootInput} name='Root' placeholder='Root' onFocus={(e) => {
                        e.preventDefault();
                        focusKeyboardOn(rootInput.current);
                    }}/>
                </div>

                {/* the word in english */}
                <div>
                    <p>Translation</p>
                    <input name='Trans' placeholder='Translation' onFocus={(e)=>{
                        e.preventDefault();
                        if(keyboardInput.current != null) {
                            keyboardInput.current.classList.remove(styles.ActiveInput);
                        }
                        keyboardInput.current = null;
                    }}/>
                </div>

                {/* example phrase */}
                <div>
                    <p>Example Phrase</p>
                    <input ref={exampleInput} name='Example' placeholder='Example Usage' onFocus={(e) => {
                        e.preventDefault();
                        focusKeyboardOn(exampleInput.current);
                    }}/>
                </div>

                {/* part of speach */}
                <div>
                    <p>Part of Speach</p>
                    <select name='POS'>
                        {KeyboardSupport.SupportedPOS.map((pos) => <option key={pos}>{pos}</option>)}
                    </select>
                </div>

                {/* subject */}
                <div>
                    <p>Subject</p>
                    <select name='Subject'>
                        {KeyboardSupport.SupportedSubjects.map((sub) => <option key={sub}>{sub}</option>)}
                    </select>
                </div>

                {/* notes on the vocab item */}
                <div>
                    <textarea ref={noteInput} placeholder='vocab note' onFocus={(e)=>{
                        e.preventDefault();
                        focusKeyboardOn(noteInput.current);
                    }} onChange={(e)=>{setVocabNote(e.target.value)}}></textarea>
                </div>

                {/* image uploading */}
                <div>
                    <input type='file' placeholder='Image' onChange={(e)=>{setImage(e.target.files[0])}} className={styles.ImageInput} accept={SupportedImageTypes}/>
                </div>

                {/* sound uploading */}
                <div>
                    <input type='file' placeholder='Sound' onChange={(e)=> {
                        // console.log(e.target.files)
                        setSound(e.target.files[0])}
                    } className={styles.SoundInput} accept={SupportedSoundTypes}/>
                </div>

                {/* form submission */}
                <div>
                    <input type='Submit' placeholder='Create Vocab'/>
                </div>
            </form>

        </div>

        <div id={styles.VocabMedia}>
            {/* previews the image */}
            {image &&
            <div id={styles.ImageWrapper}>
                <img src={fileToURL(image)}></img>
                <textarea ref={descriptionInput} placeholder='Image Description' onFocus={(e)=>{
                    e.preventDefault();
                    focusKeyboardOn(descriptionInput.current);
                }} onChange={(e)=>{setImageDescription(e.target.value)}}></textarea>
            </div>}

            {/* previews the sound */}
            {sound &&
            <div id={styles.SoundWrapper}>
                <audio controls={true}>
                    <source src={fileToURL(sound)} type='audio/mpeg'/>
                    HELP
                </audio>
            </div>}
        </div>
    </div>);
}

export default VocabCreator;
