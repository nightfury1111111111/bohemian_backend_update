import { PublicKey, TransactionInstruction } from '@solana/web3.js';
import { deserializeUnchecked, BinaryReader, BinaryWriter, serialize } from 'borsh';
import base58 from 'bs58';
import { Data, METADATA_SCHEMA, Metadata, UpdateMetadataArgs } from './classes';
import { StringPublicKey } from './types';
import { METAPLEX } from '../constants';

export const extendBorsh = () => {
    (BinaryReader.prototype as any).readPubkey = function () {
        const reader = this as unknown as BinaryReader;
        const array = reader.readFixedArray(32);
        return new PublicKey(array);
    };

    (BinaryWriter.prototype as any).writePubkey = function (value: any) {
        const writer = this as unknown as BinaryWriter;
        writer.writeFixedArray(value.toBuffer());
    };

    (BinaryReader.prototype as any).readPubkeyAsString = function () {
        const reader = this as unknown as BinaryReader;
        const array = reader.readFixedArray(32);
        return base58.encode(array) as StringPublicKey;
    };

    (BinaryWriter.prototype as any).writePubkeyAsString = function (value: StringPublicKey) {
        const writer = this as unknown as BinaryWriter;
        writer.writeFixedArray(base58.decode(value));
    };
};

extendBorsh();

export const decodeMetadata = (buffer: Buffer): Metadata => {
    const metadata = deserializeUnchecked(METADATA_SCHEMA, Metadata, buffer) as Metadata;

    metadata.data.name = metadata.data.name.replace(/\0/g, '');
    metadata.data.symbol = metadata.data.symbol.replace(/\0/g, '');
    metadata.data.uri = metadata.data.uri.replace(/\0/g, '');
    metadata.data.name = metadata.data.name.replace(/\0/g, '');
    return metadata;
};

export async function updateMetadataInstruction(
    data: Data | undefined,
    newUpdateAuthority: string | undefined,
    primarySaleHappened: boolean | null | undefined,
    mintKey: StringPublicKey,
    updateAuthority: StringPublicKey,
    metadataAccountStr?: StringPublicKey,
): Promise<TransactionInstruction> {
    const metadataProgramId = METAPLEX;
    const metadataAccountKey = metadataAccountStr ? new PublicKey(metadataAccountStr) : undefined;

    const metadataAccount =
        metadataAccountKey ||
        (
            await PublicKey.findProgramAddress(
                [Buffer.from('metadata'), metadataProgramId.toBuffer(), new PublicKey(mintKey).toBuffer()],
                metadataProgramId,
            )
        )[0];

    const value = new UpdateMetadataArgs({
        data,
        updateAuthority: !newUpdateAuthority ? undefined : newUpdateAuthority,
        primarySaleHappened:
            primarySaleHappened === null || primarySaleHappened === undefined ? null : primarySaleHappened,
    });

    // console.log('value for serialize: ', value);

    const txnData = Buffer.from(serialize(METADATA_SCHEMA, value));
    // const txnData = Buffer.from(serialize(schema, value));

    const keys = [
        {
            pubkey: metadataAccount,
            isSigner: false,
            isWritable: true,
        },
        {
            pubkey: new PublicKey(updateAuthority),
            isSigner: true,
            isWritable: false,
        },
    ];

    const instruction = new TransactionInstruction({
        keys,
        programId: new PublicKey(metadataProgramId),
        data: txnData,
    });

    return instruction;
}




// {
//     "program": {
//         "uuid":"5dwBKz",
//         "candyMachine":"5dwBKz75die5XT287eG6hcjTNZmUyvzWnx4RFp2QyTJw",
//         "collection":"9T7tv7rAoP7B1BUNZ6bjP11cx1YkrpekJUTXjTigbxwL"
//     },
//     "items":{
//         "0":{
//             "link":"https://arweave.net/6zrUqAf0myc5s6umFpPP6uOBVb4Qbuy5Ul7CDrtUwRo",
//             "name":"Bohemian #00001","onChain":true,"verifyRun":true\
//         },
//         "1":{
//             "link":"https://arweave.net/ZthGwBehOcMTiLU9oKlDnNCwtZ9VABpDaXF_pj0PaWs",
//             "name":"Bohemian #00002","onChain":true,"verifyRun":true
//         },
//         "2":{
//             "link":"https://arweave.net/WpYWZiqlqvaf7iTOT-4DnnwnDpQavJD_ZmvBduLwYxA",
//             "name":"Bohemian #00003","onChain":true,"verifyRun":true
//         },
//         "3":{
//             "link":"https://arweave.net/zmB-9TJHwIwiDpf_VYWX8DvEnxCoenA7xLdRthJQkrI",
//             "name":"Bohemian #00004","onChain":true,"verifyRun":true
//         },
//         "4":{
//             "link":"https://arweave.net/5uvvQ59LtQJxn430qODluaukYflZg245oq27U5XLdmM",
//             "name":"Bohemian #00005","onChain":true,"verifyRun":true
//         },
//         "5":{
//             "link":"https://arweave.net/jzMTScR7LxL9b-mmScEI2NnZN2ug1-IwMLcJsWyhD1A",
//             "name":"Bohemian #00006","onChain":true,"verifyRun":true
//         },
//         "6":{
//             "link":"https://arweave.net/_yOYjLKjTF7aqKwBw4rKuwTdk-AUCYJzHkLJGwLvRSE",
//             "name":"Bohemian #00007","onChain":true,"verifyRun":true
//         },
//         "7":{
//             "link":"https://arweave.net/NBheKg3NG0wDx5nFv6BMQuzvhJjk4vXHUwIS_ZTkUgs",
//             "name":"Bohemian #00008","onChain":true,"verifyRun":true
//         },
//         "8":{
//             "link":"https://arweave.net/grv72OOXEYK-_XaHkwoqezjsZKk_emzYaz2A8JvlcZU",
//             "name":"Bohemian #00009","onChain":true,"verifyRun":true
//         },
//         "9":{
//             "link":"https://arweave.net/xAsFiH2OVfNObzvuqXq-7ojgYBiJWlj51Jiz4Uu5cwQ",
//             "name":"Bohemian #00010","onChain":true,"verifyRun":true
//         }},
//     "env":"devnet",
//     "cacheName":"example"
// }