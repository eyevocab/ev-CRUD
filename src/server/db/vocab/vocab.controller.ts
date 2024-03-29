// vocab.controller.ts
// description: expressjs endpoint for accessing vocab items
// the front end code that interacts with this controller is found in the creator UX modules:
//    src/client/components/creator/vocab.creator.tsx
//    src/client/components/creator/vocab.editor.tsx
//    src/client/components/creator/vocab.viewer.tsx

import { Controller, UseInterceptors, Put, Post, Body, Param, Get, UploadedFiles } from '@nestjs/common';
import { VocabService } from './vocab.service';
import { Vocab } from '../../../api/entities/';
import { IEntity } from '../../../api';
import { IVocabMedia } from '../../../api/entities/vocab';
import { FileFieldsInterceptor, FilesInterceptor } from '@nestjs/platform-express/multer';

@Controller('api/db/vocab')
export class VocabController {
    constructor(private readonly vocabService: VocabService) {}
    
    // @Get('/fromCollection/:collectionID')
    // async getVocabfromCollection(@Param('collectionID') id: string): Promise<Vocab.Get[]> {
    //     return await this.vocabService.getVocabfromCollection(id);
    // }

    @Get('all')
    async getAllVocab(): Promise<Vocab.Get[]> {
        return await this.vocabService.getAll();
    }

    @Get('fromUser/:userID')
    async getVocabFromUser(@Param('userID') id: string): Promise<Vocab.Get[]> {
        return await this.vocabService.getVocabFromUser({id: id});
    }

    @Get('media/:vocabID')
    async getVocabMedia(@Param('vocabID') id: string): Promise<IVocabMedia[]> {
        return await this.vocabService.getMedia(id);
    }

    @Put('/new')
    async createVocab(@Body() data: Vocab.Put): Promise<string> {
        console.log('endpoint for inserting new vocab');
        console.log(data);
        const vocab: Vocab.Put = data['body'];
        console.log(vocab);
        // insert into data base
        let result: string;
        try {
            result = await this.vocabService.insertVocab(vocab);
        } catch(err) {
            console.log(`error on api/db/vocab PUT`);
        }

        // update the creator's list of vocab items
        try {
            result += '\n' + await this.vocabService.updateCreator(vocab.creator, {id: vocab.id})
        } catch(err) {
            console.log(err);
        }

        return result;
    }

    @Put('/new/media')
    @UseInterceptors(FileFieldsInterceptor([
        { name: 'image' },
        { name: 'sound' },
        // { name: 'id' },
        // { name: 'description' },
        // { name: 'creatorID' }
    ]))
    async createVocabMedia(@UploadedFiles() files: {
        image?: Express.Multer.File[],
        sound?: Express.Multer.File[]
    }): Promise<string> {
        console.log('endpoint for inserting new vocab media');
        console.log(files);

        const image_file: Express.Multer.File = files.image[0];
        const sound_file: Express.Multer.File = files.sound[0];
        console.log('image file', image_file);
        console.log('sound file', sound_file);

        const encoding_1: string = image_file.originalname;
        const val_1: string[] = encoding_1.split('.');
        console.log(val_1);
        const vocab: IEntity = {id: val_1[1]};
        const id: string = val_1[3];

        const encoding_2: string = sound_file.originalname;
        const val_2: string[] = encoding_2.split('.');
        console.log(val_2);
        const creator: IEntity = {id: val_2[1]};
        const description: string = val_2[3];

        let payload: IVocabMedia = {
            image: image_file.buffer,
            sound: sound_file.buffer,
            id: id,
            creator: creator,
            description: description,
            vocab: vocab
        }

        try {
            console.log('inserting\n', payload);
            await this.vocabService.insertVocabMedia(payload);
            console.log('inserted vocab media');
        } catch(err) {
            console.log('error inserting vocab media!');
            console.log(err);
        }

        return 'testing';
    }

    @Post('/edit')
    async editVocab(@Body() data: Vocab.Post): Promise<string> {
        console.log('endpoint for eidting a vocab');
        console.log(data);
        const vocab: Vocab.Post = data['body'];
        console.log(vocab);
        // insert into data base
        let result: string;
        try {
            result = await this.vocabService.updateVocab(vocab);
        } catch(err) {
            console.log(`error on api/db/vocab PUT`);
        }
        return result;
    }

    @Put('/edit/media')
    @UseInterceptors(FileFieldsInterceptor([
        { name: 'image' },
        { name: 'sound' },
        // { name: 'id' },
        // { name: 'description' },
        // { name: 'creatorID' }
    ]))
    async editVocabMedia(@UploadedFiles() files: {
        image?: Express.Multer.File[],
        sound?: Express.Multer.File[]
    }): Promise<string> {
        console.log('endpoint for editing vocab media');
        console.log(files);

        const image_file: Express.Multer.File = files.image[0];
        const sound_file: Express.Multer.File = files.sound[0];
        console.log('image file', image_file);
        console.log('sound file', sound_file);

        const encoding_1: string = image_file.originalname;
        const val_1: string[] = encoding_1.split('.');
        console.log(val_1);
        const vocab: IEntity = {id: val_1[1]};
        const id: string = val_1[3];

        const encoding_2: string = sound_file.originalname;
        const val_2: string[] = encoding_2.split('.');
        console.log(val_2);
        const creator: IEntity = {id: val_2[1]};
        const description: string = val_2[3];

        let payload: IVocabMedia = {
            image: image_file.buffer,
            sound: sound_file.buffer,
            id: id,
            creator: creator,
            description: description,
            vocab: vocab
        }

        try {
            console.log('inserting\n', payload);
            await this.vocabService.updateMedia(payload);
            console.log('inserted vocab media');
        } catch(err) {
            console.log('error inserting vocab media!');
            console.log(err);
        }

        return 'testing';
    }

    // @Put('/media')
    // @UseInterceptors(FileFieldsInterceptor([
    //     { name: 'image' },
    //     { name: 'sound' }
    // ]))
    // async insertCollectionMedia(@UploadedFiles() files: 
    // { image?: Express.Multer.File[], sound?: Express.Multer.File[], document?: Express.Multer.File}
    // ): Promise<string> {
    //     let result: string;
    //     try{
    //         await this.collectionService.insertCollectionMedia(files.image, files.sound);
    //     } catch(err) {
    //         console.log(err);
    //     }
    //     return;
    // }
}