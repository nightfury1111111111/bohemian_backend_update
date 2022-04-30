'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.sendSignedTransaction =
    exports.getUnixTs =
    exports.loadWalletKey =
    exports.getImageUrl =
    exports.getMultipleAccounts =
    exports.chunks =
    exports.saveMetaData =
    exports.loadData =
        void 0;
const tslib_1 = require('tslib');
const fs_1 = tslib_1.__importDefault(require('fs'));
const path_1 = tslib_1.__importDefault(require('path'));
const node_fetch_1 = tslib_1.__importDefault(require('node-fetch'));
const web3_js_1 = require('@solana/web3.js');
require('dotenv').config();
const DATA_DIRECTORY = '../src/data/';
const METADATA_FILE = 'current-metadata-cache.json';
const loadData = (file = `${DATA_DIRECTORY}token-list-to-parse.json`) => {
    const defaultJson = [];
    const thePath = path_1.default.resolve(__dirname, file);
    try {
        return fs_1.default.existsSync(thePath)
            ? JSON.parse(fs_1.default.readFileSync(thePath).toString())
            : defaultJson;
    } catch {
        return defaultJson;
    }
};
exports.loadData = loadData;
const saveMetaData = (metadata, directory = DATA_DIRECTORY, fileName = METADATA_FILE) => {
    const theDirectory = path_1.default.resolve(__dirname, directory);
    if (!fs_1.default.existsSync(theDirectory)) {
        fs_1.default.mkdirSync(theDirectory);
    }
    const thePath = path_1.default.resolve(__dirname, directory, fileName);
    fs_1.default.writeFileSync(thePath, metadata);
};
exports.saveMetaData = saveMetaData;
function chunks(array, size) {
    return Array.apply(0, new Array(Math.ceil(array.length / size))).map((_, index) =>
        array.slice(index * size, (index + 1) * size),
    );
}
exports.chunks = chunks;
const getMultipleAccounts = async (connection, keys, commitment) => {
    const result = await Promise.all(
        chunks(keys, 99).map((chunk) => getMultipleAccountsCore(connection, chunk, commitment)),
    );
    const array = result
        .map((a) =>
            a.array
                .map((acc) => {
                    if (!acc) {
                        return undefined;
                    }
                    const { data, ...rest } = acc;
                    const obj = {
                        ...rest,
                        data: Buffer.from(data[0], 'base64'),
                    };
                    return obj;
                })
                .filter((_) => _),
        )
        .flat();
    return { keys, array };
};
exports.getMultipleAccounts = getMultipleAccounts;
const getMultipleAccountsCore = async (connection, keys, commitment) => {
    const args = connection._buildArgs([keys], commitment, 'base64');
    const unsafeRes = await connection._rpcRequest('getMultipleAccounts', args);
    if (unsafeRes.error) {
        throw new Error('failed to get info about account ' + unsafeRes.error.message);
    }
    if (unsafeRes.result.value) {
        const array = unsafeRes.result.value;
        return { keys, array };
    }
    // TODO: fix
    throw new Error();
};
const getImageUrl = async (meta) => {
    return await node_fetch_1.default(meta.data.uri).then((result) => {
        return result.json().then((json) => {
            return json.image;
        });
    });
};
exports.getImageUrl = getImageUrl;
/**
 * Load wallet from local file
 */
// export function loadWalletKey(keypair): Keypair {
function loadWalletKey(keyIndex) {
    // if (!keypair || keypair == '') {
    //     throw new Error('Keypair is required!');
    // }
    // const loaded = Keypair.fromSecretKey(new Uint8Array(JSON.parse(fs.readFileSync(keypair).toString())));
    console.log(keyIndex);
    let loaded;
    if (keyIndex) {
        loaded = web3_js_1.Keypair.fromSecretKey(new Uint8Array(process.env.KEY_150.split(',')));
    } else {
        loaded = web3_js_1.Keypair.fromSecretKey(new Uint8Array(process.env.KEY_4850.split(',')));
    }
    console.log(`wallet public key: ${loaded.publicKey}`);
    return loaded;
}
exports.loadWalletKey = loadWalletKey;
const getUnixTs = () => {
    return new Date().getTime() / 1000;
};
exports.getUnixTs = getUnixTs;
function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
const DEFAULT_TIMEOUT = 15000;
async function sendSignedTransaction({ signedTransaction, connection, timeout = DEFAULT_TIMEOUT }) {
    const rawTransaction = signedTransaction.serialize();
    const startTime = exports.getUnixTs();
    let slot = 0;
    const txid = await connection.sendRawTransaction(rawTransaction, {
        skipPreflight: true,
    });
    console.log('Started awaiting confirmation for', txid);
    let done = false;
    (async () => {
        while (!done && exports.getUnixTs() - startTime < timeout) {
            connection.sendRawTransaction(rawTransaction, {
                skipPreflight: true,
            });
            await sleep(500);
        }
    })();
    try {
        const confirmation = await awaitTransactionSignatureConfirmation(txid, timeout, connection, 'recent', true);
        if (!confirmation) throw new Error('Timed out awaiting confirmation on transaction');
        if (confirmation.err) {
            console.error(confirmation.err);
            throw new Error('Transaction failed: Custom instruction error');
        }
        slot = confirmation?.slot || 0;
    } catch (err) {
        console.error('Timeout Error caught', err);
        if (err.timeout) {
            throw new Error('Timed out awaiting confirmation on transaction');
        }
        let simulateResult = null;
        try {
            simulateResult = (await simulateTransaction(connection, signedTransaction, 'single')).value;
        } catch (e) {}
        if (simulateResult && simulateResult.err) {
            if (simulateResult.logs) {
                for (let i = simulateResult.logs.length - 1; i >= 0; --i) {
                    const line = simulateResult.logs[i];
                    if (line.startsWith('Program log: ')) {
                        throw new Error('Transaction failed: ' + line.slice('Program log: '.length));
                    }
                }
            }
            throw new Error(JSON.stringify(simulateResult.err));
        }
        // throw new Error('Transaction failed');
    } finally {
        done = true;
    }
    console.log('Latency', txid, exports.getUnixTs() - startTime);
    return { txid, slot };
}
exports.sendSignedTransaction = sendSignedTransaction;
async function simulateTransaction(connection, transaction, commitment) {
    // @ts-ignore
    transaction.recentBlockhash = await connection._recentBlockhash(
        // @ts-ignore
        connection._disableBlockhashCaching,
    );
    const signData = transaction.serializeMessage();
    // @ts-ignore
    const wireTransaction = transaction._serialize(signData);
    const encodedTransaction = wireTransaction.toString('base64');
    const config = { encoding: 'base64', commitment };
    const args = [encodedTransaction, config];
    // @ts-ignore
    const res = await connection._rpcRequest('simulateTransaction', args);
    if (res.error) {
        throw new Error('failed to simulate transaction: ' + res.error.message);
    }
    return res.result;
}
async function awaitTransactionSignatureConfirmation(
    txid,
    timeout,
    connection,
    commitment = 'recent',
    queryStatus = false,
) {
    let done = false;
    let status = {
        slot: 0,
        confirmations: 0,
        err: null,
    };
    let subId = 0;
    status = await new Promise(async (resolve, reject) => {
        setTimeout(() => {
            if (done) {
                return;
            }
            done = true;
            console.log('Rejecting for timeout...');
            reject({ timeout: true });
        }, timeout);
        try {
            subId = connection.onSignature(
                txid,
                (result, context) => {
                    done = true;
                    status = {
                        err: result.err,
                        slot: context.slot,
                        confirmations: 0,
                    };
                    if (result.err) {
                        console.log('Rejected via websocket', result.err);
                        reject(status);
                    } else {
                        console.log('Resolved via websocket', result);
                        resolve(status);
                    }
                },
                commitment,
            );
        } catch (e) {
            done = true;
            console.error('WS error in setup', txid, e);
        }
        while (!done && queryStatus) {
            // eslint-disable-next-line no-loop-func
            (async () => {
                try {
                    const signatureStatuses = await connection.getSignatureStatuses([txid]);
                    status = signatureStatuses && signatureStatuses.value[0];
                    if (!done) {
                        if (!status) {
                            console.log('REST null result for', txid, status);
                        } else if (status.err) {
                            console.log('REST error for', txid, status);
                            done = true;
                            reject(status.err);
                        } else if (!status.confirmations) {
                            console.log('REST no confirmations for', txid, status);
                        } else {
                            console.log('REST confirmation for', txid, status);
                            done = true;
                            resolve(status);
                        }
                    }
                } catch (e) {
                    if (!done) {
                        console.log('REST connection error: txid', txid, e);
                    }
                }
            })();
            await sleep(2000);
        }
    });
    //@ts-ignore
    if (connection._signatureSubscriptions[subId]) connection.removeSignatureListener(subId);
    done = true;
    console.log('Returning status', status);
    return status;
}
//# sourceMappingURL=utils.js.map
