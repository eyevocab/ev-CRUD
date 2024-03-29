// collection.controller.ts
// description: expressjs endpoint for accessing collection items
// the front end code that interacts with this controller is found in the creator UX modules:
//    src/client/components/creator/collection.creator.tsx
//    src/client/components/creator/collection.editor.tsx
//    src/client/components/creator/collection.viewer.tsx

// Note: currently the collection controller does not handle the routing of image or sound files. This is handled by the vocab controller. But, to support collection meta images (backgrounds / themes / etc) then multer support will need to be added. See the vocab controller for an example of how multer routing works.
// TODO document how to support multer on expressjs routes in nestjs

import { Controller, Post, Body, Get, Param, Put, Delete, UseInterceptors, UploadedFiles } from '@nestjs/common';
import { CollectionService } from './collection.service';
import { Collection, Vocab } from '../../../api';
import { IEntity } from '../../../api';
import { FileFieldsInterceptor, FilesInterceptor } from '@nestjs/platform-express/multer';
import { Express } from 'express';
import { stringify } from 'querystring';
import { IVocabMedia } from '../../../api/entities/vocab';

@Controller('api/db/collections')
export class CollectionController {
    constructor(private readonly collectionService: CollectionService) {}

    @Get('fromUser/:userID')
    async getCollection(@Param('userID') id): Promise<Collection.Get[]> {
        return await this.collectionService.getUserCollections(id);
    }

    @Put('new')
    async insertNewCollection(@Body() data): Promise<boolean> {
        console.log(data);
        const payload: Collection.Put = data['body'];
        try {
            await this.collectionService.insertCollection(payload);
            await this.collectionService.updateCreatorCollections(payload.creator, payload);
            return true;
        } catch(err) {
            return false;
        }
        return true;
    }

    @Post('edit')
    async updateCollection(@Body() data): Promise<boolean> {
        console.log(data);
        const payload: Collection.Post = data['body'];
        try {
            await this.collectionService.updateCollection(payload);
            return true;
        } catch(err) {
            return false;
        }
        return true;
    }

    // @Get('/:userID')
    // async getCollection(@Param('userID') id): Promise<Collection.Get[]> {
    //     return await this.collectionService.getUserCollections(id);
    // }

    // @Put()
    // async insertCollection(@Body() data: Collection.Put) {
    //     let result: string;
    //     try {
    //         await this.collectionService.insertCollection(data);
    //         result = `logged ${data.id}`;
    //     } catch(err) {
    //         console.log(`error on api/db/collection PUT`);
    //     }
    //     return result;
    // }

    // @Get('/media/:storagekey')
    // async getVocabMedia(@Param('storagekey') key: string): Promise<IVocabMediaMulter[]> {
    //     return this.collectionService.getMedia(key);
    // }

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

    // @Delete()
    // async deleteCollection(@Body() collection: Collection.Delete): Promise<string> {
    //     let result: string;
    //     try {
    //         // delete from the database 
    //         console.log(await this.collectionService.deleteCollection(collection.id));
    //         // update the creator's record
    //         console.log(await this.collectionService.updateCreatorCollections(collection.creator.id, collection.id));

    //         console.log(`deleted collection.id    \t ${collection.id}`);
    //         console.log(`deleted collection.items \t ${collection.items}`);
    //     } catch(err) {
    //         return 'error!';
    //     }
    //     return `deleted collection.id\t=${collection.id}`
    // }

    // @Delete('/:collectionID')
    // async deleteItemsFromCollection(@Param('collectionID') id, @Body() data: Vocab.Delete[]): Promise<boolean> {
    //     try {
    //         return await this.collectionService.deleteItemsFromCollections(id, data);
    //     } catch(err) {
    //         return false;
    //     }
    // }

    // // TODO move to the vocab controller
    // @Put('/:collectionID')
    // async updateItemsFromCollection(@Param('collectionID') id, @Body() data: Vocab.Put[]): Promise<boolean> {
    //     console.log('got vocab edit request!');
    //     console.log(data['data']);
    //     let ids: IEntity[] = [];
    //     for(let i = 0; i < data['data'].length; i++) {
    //         ids.push(data['data'][i]);
    //     }

    //     try {
    //         return this.collectionService.updateVocabItems(ids, data['data']);
    //     } catch(e) {
    //         console.log(e);
    //         return false;
    //     }
    // }

}