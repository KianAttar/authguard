import mongoose from "mongoose";

class AbstractModel<DocType extends mongoose.Document> {
    protected doc: DocType;

    constructor(doc: DocType) {
        this.doc = doc;
    }
    getId(): string {
        return (this.doc.id ?? this.doc._id).toString();
    }
}

export { AbstractModel };
