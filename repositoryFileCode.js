
// ========== fill master sentence collection ================================================//
async fillMasterSentenceCollection(keywordId) {
        try {
            if (!keywordId) {
                throw new Error("Keyword ID is required.");
            }
    
            // Fetch the keyword document
            const keywordDoc = await keywordModel.findById(keywordId);
            if (!keywordDoc) {
                throw new Error("Keywords document not found.");
            }
    
            const keywordWords = keywordDoc.keywords;
            const combinations = this.getCombinations(keywordWords);
            const totalRequiredSentences = (Math.pow(2, keywordWords.length) - 1) * 3;
    
            // Count current sentences in MasterSentence
            const currentCount = await MasterSentence.countDocuments({ keywords: keywordId });
            const missingSentences = totalRequiredSentences - currentCount;
    
            if (missingSentences <= 0) {
                return { success: true, message: "MasterSentence collection is already filled." };
            }
    
            let insertedSentences = [];
            const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
    
            for (const combination of combinations) {
                const existingCount = await MasterSentence.countDocuments({
                    keywords: keywordId,
                    presentCombinationWord: { $all: combination, $size: combination.length }
                });
    
                const requiredForCombination = 3 - existingCount;
                if (requiredForCombination <= 0) continue;
    
                // Fetch from InuseSentenceModel (older than 2 hours)
                const inuseSentences = await InuseSentenceModel.find({
                    keywords: keywordId,
                    presentCombinationWord: { $all: combination, $size: combination.length },
                    createdAt: { $lt: twoHoursAgo }
                }).limit(requiredForCombination);
    
                if (inuseSentences.length > 0) {
                    await MasterSentence.insertMany(inuseSentences);
                    insertedSentences.push(...inuseSentences);
                    await InuseSentenceModel.deleteMany({ _id: { $in: inuseSentences.map(s => s._id) } });
                }
    
                // Fetch from ParsentSentenceModel if still needed
                const remainingNeeded = requiredForCombination - inuseSentences.length;
                if (remainingNeeded > 0) {
                    const parentSentences = await ParsentSentenceModel.find({
                        keywords: keywordId,
                        presentCombinationWord: { $all: combination, $size: combination.length }
                    }).limit(remainingNeeded);
    
                    if (parentSentences.length > 0) {
                        await MasterSentence.insertMany(parentSentences);
                        insertedSentences.push(...parentSentences);
                        await ParsentSentenceModel.deleteMany({ _id: { $in: parentSentences.map(s => s._id) } });
                    }
                }
            }
    
            console.log(`Inserted ${insertedSentences.length} sentences into MasterSentence.`);
            return { success: true, message: "MasterSentence collection updated successfully.", data: insertedSentences };
        } catch (error) {
            console.log("Error in filling master sentence collection:", error);
            throw error;
        }
    }
