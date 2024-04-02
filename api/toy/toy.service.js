import mongodb from 'mongodb'
const { ObjectId } = mongodb

import { dbService } from '../../services/db.service.js'
import { loggerService } from '../../services/logger.service.js'
import { utilService } from '../../services/util.service.js'

// const PAGE_SIZE = 1000

async function query(filterBy, sortBy) {
    try {
        const criteria = {}

        if (filterBy.txt) {
            criteria.name = { $regex: filterBy.txt, $options: 'i' }
        }

        if (filterBy.inStock) {
            criteria.inStock = (filterBy.inStock === 'true')
        }

        if (filterBy.labels && filterBy.labels.length) {
            criteria.labels = { $all: filterBy.labels.filter(l => l) }
        }

        const collection = await dbService.getCollection('toy')

        let options = {}

        if (sortBy.type) {
            options.sort = { [sortBy.type]: parseInt(sortBy.dir, 10) }
        }
        var toysToShow = await collection.find(criteria, options).sort(options.sort).toArray()
        // if (filterBy.pageIdx !== undefined) {
        //     carCursor.skip(filterBy.pageIdx * PAGE_SIZE).limit(PAGE_SIZE)     
        // }

        return toysToShow
    } catch (err) {
        loggerService.error('cannot find toys', err)
        throw err
    }
}

async function getById(toyId) {
    try {
        const collection = await dbService.getCollection('toy')
        var toy = collection.findOne({ _id: new ObjectId(toyId) })
        return toy
    } catch (err) {
        loggerService.error(`while finding toy ${toyId}`, err)
        throw err
    }
}

async function remove(toyId) {
    try {
        const collection = await dbService.getCollection('toy')
        await collection.deleteOne({ _id: new ObjectId(toyId) })
    } catch (err) {
        loggerService.error(`cannot remove toy ${toyId}`, err)
        throw err
    }
}

async function add(toy) {
    try {
        const collection = await dbService.getCollection('toy')
        await collection.insertOne(toy)
        return toy
    } catch (err) {
        loggerService.error('cannot insert toy', err)
        throw err
    }
}

async function update(toy) {
    try {
        const toyToSave = {
            name: toy.name,
            // importance: toy.importance
            price: toy.price
        }
        const collection = await dbService.getCollection('toy')
        await collection.updateOne({ _id: new ObjectId(toy._id) }, { $set: toyToSave })
        return toy
    } catch (err) {
        loggerService.error(`cannot update toy ${toy._id}`, err)
        throw err
    }
}

async function addToyMsg(toyId, msg) {
    try {
        msg.id = utilService.makeId()
        const collection = await dbService.getCollection('toy')
        await collection.updateOne({ _id: new ObjectId(toyId) }, { $push: { msgs: msg } })
        return msg
    } catch (err) {
        loggerService.error(`cannot add toy msg ${toyId}`, err)
        throw err
    }
}

async function removeToyMsg(toyId, msgId) {
    try {
        const collection = await dbService.getCollection('toy')
        await collection.updateOne({ _id: new ObjectId(toyId) }, { $pull: { msgs: { id: msgId } } })
        return msgId
    } catch (err) {
        loggerService.error(`cannot add toy msg ${toyId}`, err)
        throw err
    }
}

function _buildCriteria(filterBy) {
    const { labels, txt, status } = filterBy

    const criteria = {}

    if (txt) {
        criteria.name = { $regex: txt, $options: 'i' }
    }

    if (labels && labels.length) {
        //every for objects labels
        // const labelsCrit = labels.map(label => ({
        //   labels: { $elemMatch: { title: label } },
        // }))

        //every for string labels
        // const labelsCrit = labels.map((label) => ({
        // 	labels: label,
        // }))
        // criteria.$and = labelsCrit
        // criteria.labels =  { $all: labels }

        // for some for string labels

        criteria.labels = { $in: labels } //['Doll']
    }

    if (status) {
        criteria.inStock = status === 'true' ? true : false
    }
    if (status) {
        criteria.inStock = status === 'true' ? true : false
    }


    return criteria
}

export const toyService = {
    remove,
    query,
    getById,
    add,
    update,
    addToyMsg: addToyMsg,
    removeToyMsg: removeToyMsg
}
