import { Translator } from "./Translator";
import { ErrorDialog } from "../ErrorDialog";
import {
    _split_at_p,
    _split_html,
    translate_html,
    getTranslationSettings,
    dialogTokenMissing,
    determineFolder,
    translate_text,
    determineNewName,
    parseAsArray,
} from "../lib";
import SETTINGS from "../constants/settings";
import Logger from "../lib/Logger";

export class ItemTranslator extends Translator {
    /**
     *
     * @param {Item} documentToTranslate
     * @returns {Promise<void>}
     */
    async translateButton(documentToTranslate) {
        const { token, target_lang, makeSeparateFolder, translateInPlace } = await getTranslationSettings();
        if (!token) {
            dialogTokenMissing();
        } else {
            // Not every system has the "description" property on system item
            const fieldsToTranslate = parseAsArray(SETTINGS.ITEM_DESCRIPTION_PROPERTY);
            if (fieldsToTranslate?.length > 0) {
                for (const fieldToTranslate of fieldsToTranslate) {
                    const textToTranslate = foundry.utils.getProperty(documentToTranslate, fieldToTranslate);
                    if (textToTranslate) {
                        if (!translateInPlace) {
                            Logger.debug(
                                `Translate not in place on the item ${documentToTranslate.name} field ${fieldToTranslate}`,
                            );
                            await this.translateAndCreateItem(
                                documentToTranslate,
                                token,
                                target_lang,
                                makeSeparateFolder,
                            );
                        } else {
                            Logger.debug(
                                `Translate in place on the item ${documentToTranslate.name} field ${fieldToTranslate}`,
                            );
                            await this.translateAndReplaceOriginal(documentToTranslate, token, target_lang);
                        }
                    } else {
                        // DO NOTHING
                        Logger.warn(
                            `Nothing to translate on the item ${documentToTranslate.name} field ${fieldToTranslate}`,
                        );
                    }
                }
            } else {
                Logger.warn(`Nothing to translate on the item ${documentToTranslate.name}`);
            }
        }
    }

    /**
     *
     * @param {Item} documentToTranslate
     * @param {string} token
     * @param {string} target_lang
     * @returns {Promise<void>}
     */
    async translateAndReplaceOriginal(documentToTranslate, token, target_lang) {
        const newDescriptionText = await translate_html(
            documentToTranslate.system.description.value,
            token,
            target_lang,
        ).catch((e) => {
            new ErrorDialog(e.message);
        });
        documentToTranslate.update({
            system: { description: { value: newDescriptionText } },
        });
    }

    /**
     *
     * @param {Item} documentToTranslate
     * @param {string} token
     * @param {string} target_lang
     * @param {boolean} makeSeparateFolder
     * @returns {Promise<void>}
     */
    async translateAndCreateItem(documentToTranslate, token, target_lang, makeSeparateFolder) {
        let newName = await determineNewName(documentToTranslate);
        const newDescriptionText = await translate_html(
            documentToTranslate.system.description.value,
            token,
            target_lang,
        ).catch((e) => {
            new ErrorDialog(e.message);
        });
        if (!newDescriptionText) {
        }
        const newFolder = await determineFolder(documentToTranslate, target_lang, makeSeparateFolder);
        const newItems = await Item.createDocuments([
            {
                ...documentToTranslate,
                name: newName,
                folder: newFolder,
                type: documentToTranslate.type,
            },
        ]);
        if (!newItems || newItems.length <= 0) {
            //
        }

        // await newItems[0].update({
        //   system: {
        //     description: {
        //       value:
        //     }newDescriptionText
        //   }
        // });
        await newItems[0].update({
            system: { description: { value: newDescriptionText } },
        });
    }
}
