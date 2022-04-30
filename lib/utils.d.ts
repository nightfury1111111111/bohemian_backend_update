/// <reference types="node" />
import { AccountInfo, Keypair, Transaction, Connection } from '@solana/web3.js';
import { Metadata } from './metaplex/classes';
declare type Creator = {
    address: string;
    verified: number;
    share: number;
};
export declare type TokenMeta = {
    metaKey: string;
    mintMetaData: {
        key: number;
        updateAuthority: string;
        mint: string;
        data: {
            name: string;
            symbol: string;
            uri: string;
            sellerFeeBasisPoints: number;
            creators: Creator[];
        };
        primarySaleHappened: number;
        isMutable: number;
    };
    name: string;
    uri: string;
    imageUri: string;
};
export declare type MetadataCacheContent = {
    [key: string]: TokenMeta;
};
export declare type ArweaveLinks = {
    [index: string]: {
        link: string;
        name: string;
        imageUri?: string;
    };
};
export declare type MetaplexCacheJson = {
    program: unknown;
    items: ArweaveLinks;
};
declare type JsonFileContent = string[] | MetadataCacheContent | MetaplexCacheJson;
export declare const loadData: (file?: string) => JsonFileContent;
export declare const saveMetaData: (metadata: string, directory?: string, fileName?: string) => void;
export declare function chunks<T>(array: T[], size: number): T[][];
export declare const getMultipleAccounts: (connection: any, keys: string[], commitment: string) => Promise<{
    keys: string[];
    array: AccountInfo<Buffer>[];
}>;
export declare const getImageUrl: (meta: Metadata) => Promise<string>;
/**
 * Load wallet from local file
 */
export declare function loadWalletKey(): Keypair;
export declare const getUnixTs: () => number;
export declare function sendSignedTransaction({ signedTransaction, connection, timeout, }: {
    signedTransaction: Transaction;
    connection: Connection;
    sendingMessage?: string;
    sentMessage?: string;
    successMessage?: string;
    timeout?: number;
}): Promise<{
    txid: string;
    slot: number;
}>;
export {};
