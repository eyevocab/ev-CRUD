import { Controller, Post, Body, Get, Param, Put, Delete } from '@nestjs/common';
import { CollectionService } from './collection.service';
import { CollectionPut } from './collection.put';
import { CollectionGet } from './collection.get';
import { CollectionDelete } from './collection.delete';
import { VocabDelete } from '../vocab/vocab.delete';
import { VocabPut } from '../vocab/vocab.put';
import { IEntity } from '../../../api';


@Controller('api/db/collection')
export class CollectionController {
    constructor(private readonly collectionService: CollectionService) {}

    @Get('/:userID')
    async getCollection(@Param('userID') id): Promise<CollectionGet[]> {
        return await this.collectionService.getUserCollections(id);
    }

    @Put()
    async insertCollection(@Body() data: CollectionPut): Promise<string> {
        let result: string;
        try {
            await this.collectionService.insertCollection(data);
            result = `logged ${data.id}`;
        } catch(err) {
            console.log(`error on api/db/collection PUT`);
        }
        return result;
    }

    @Delete()
    async deleteCollection(@Body() collection: CollectionDelete): Promise<string> {
        let result: string;
        try {
            // delete from the database 
            console.log(await this.collectionService.deleteCollection(collection.id));
            // update the creator's record
            console.log(await this.collectionService.updateCreatorCollections(collection.creator.id, collection.id));

            console.log(`deleted collection.id    \t ${collection.id}`);
            console.log(`deleted collection.items \t ${collection.items}`);
        } catch(err) {
            return 'error!';
        }
        return `deleted collection.id\t=${collection.id}`
    }

    @Delete('/:collectionID')
    async deleteItemsFromCollection(@Param('collectionID') id, @Body() data: VocabDelete[]): Promise<boolean> {
        try {
            return await this.collectionService.deleteItemsFromCollections(id, data);
        } catch(err) {
            return false;
        }
    }

    // TODO move to the vocab controller
    @Put('/:collectionID')
    async updateItemsFromCollection(@Param('collectionID') id, @Body() data: VocabPut[]): Promise<boolean> {
        console.log('got vocab edit request!');
        console.log(data['data']);
        let ids: IEntity[] = [];
        for(let i = 0; i < data['data'].length; i++) {
            ids.push(data['data'][i]);
        }

        try {
            return this.collectionService.updateVocabItems(ids, data['data']);
        } catch(e) {
            console.log(e);
            return false;
        }
    }

}