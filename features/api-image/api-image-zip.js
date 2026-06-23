function readU16(view, offset) {
    return view.getUint16(offset, true);
}

function readU32(view, offset) {
    return view.getUint32(offset, true);
}

function bytesToBase64(bytes) {
    let binary = '';
    const chunkSize = 0x8000;
    for (let i = 0; i < bytes.length; i += chunkSize) {
        binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
    }
    return btoa(binary);
}

function inferImageMime(bytes, filename = '') {
    const lowerName = filename.toLowerCase();
    if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return 'image/png';
    if (bytes[0] === 0xff && bytes[1] === 0xd8) return 'image/jpeg';
    if (
        bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
        bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50
    ) return 'image/webp';
    if (lowerName.endsWith('.jpg') || lowerName.endsWith('.jpeg')) return 'image/jpeg';
    if (lowerName.endsWith('.webp')) return 'image/webp';
    return 'image/png';
}

function hasImageSignature(bytes, filename = '') {
    const lowerName = filename.toLowerCase();
    return lowerName.endsWith('.png') ||
        lowerName.endsWith('.jpg') ||
        lowerName.endsWith('.jpeg') ||
        lowerName.endsWith('.webp') ||
        (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) ||
        (bytes[0] === 0xff && bytes[1] === 0xd8) ||
        (
            bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
            bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50
        );
}

async function inflateRawDeflate(bytes) {
    if (typeof DecompressionStream !== 'function') {
        throw new Error('当前浏览器不支持解压 NovelAI 返回的 zip，请升级浏览器或改用支持 DecompressionStream 的环境');
    }

    const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
    return new Uint8Array(await new Response(stream).arrayBuffer());
}

function findEndOfCentralDirectory(view) {
    const minOffset = Math.max(0, view.byteLength - 0xffff - 22);
    for (let offset = view.byteLength - 22; offset >= minOffset; offset--) {
        if (readU32(view, offset) === 0x06054b50) return offset;
    }
    return -1;
}

function parseCentralDirectoryEntries(view) {
    const eocdOffset = findEndOfCentralDirectory(view);
    if (eocdOffset < 0) {
        throw new Error('NovelAI 返回的图片包不是有效 zip');
    }

    const entryCount = readU16(view, eocdOffset + 10);
    const centralOffset = readU32(view, eocdOffset + 16);
    const entries = [];
    let offset = centralOffset;

    for (let i = 0; i < entryCount; i++) {
        if (readU32(view, offset) !== 0x02014b50) break;
        const method = readU16(view, offset + 10);
        const compressedSize = readU32(view, offset + 20);
        const uncompressedSize = readU32(view, offset + 24);
        const nameLength = readU16(view, offset + 28);
        const extraLength = readU16(view, offset + 30);
        const commentLength = readU16(view, offset + 32);
        const localOffset = readU32(view, offset + 42);
        const nameBytes = new Uint8Array(view.buffer, view.byteOffset + offset + 46, nameLength);
        const filename = new TextDecoder().decode(nameBytes);

        entries.push({
            compressedSize,
            filename,
            localOffset,
            method,
            uncompressedSize,
        });
        offset += 46 + nameLength + extraLength + commentLength;
    }

    return entries;
}

async function readZipEntry(view, entry) {
    const localOffset = entry.localOffset;
    if (readU32(view, localOffset) !== 0x04034b50) {
        throw new Error(`NovelAI 图片包内 ${entry.filename || '未知文件'} 的本地头无效`);
    }

    const localNameLength = readU16(view, localOffset + 26);
    const localExtraLength = readU16(view, localOffset + 28);
    const dataOffset = localOffset + 30 + localNameLength + localExtraLength;
    const compressed = new Uint8Array(view.buffer, view.byteOffset + dataOffset, entry.compressedSize);

    if (entry.method === 0) return compressed;
    if (entry.method === 8) return inflateRawDeflate(compressed);
    throw new Error(`NovelAI 图片包使用了暂不支持的 zip 压缩方式: ${entry.method}`);
}

function isImageFilename(filename) {
    return /\.(png|jpe?g|webp)$/i.test(filename || '');
}

export async function extractImageDataUrlsFromZip(arrayBuffer) {
    const buffer = arrayBuffer instanceof ArrayBuffer ? arrayBuffer : await arrayBuffer.arrayBuffer?.();
    if (!buffer) throw new Error('NovelAI 没有返回可解析的图片包');

    const view = new DataView(buffer);
    if (view.byteLength >= 2) {
        const first = view.getUint8(0);
        const second = view.getUint8(1);
        if (first === 0x7b || first === 0x5b || (first === 0x1f && second === 0x8b)) {
            const text = new TextDecoder().decode(new Uint8Array(buffer)).replace(/\s+/g, ' ').trim();
            throw new Error(`NovelAI 返回了错误文本而不是图片包: ${text.slice(0, 240)}`);
        }
    }

    const entries = parseCentralDirectoryEntries(view)
        .filter(entry => entry.compressedSize > 0 && !entry.filename.endsWith('/'))
        .sort((a, b) => Number(isImageFilename(b.filename)) - Number(isImageFilename(a.filename)));

    const images = [];
    for (const entry of entries) {
        const bytes = await readZipEntry(view, entry);
        if (!hasImageSignature(bytes, entry.filename)) continue;
        const mime = inferImageMime(bytes, entry.filename);
        images.push(`data:${mime};base64,${bytesToBase64(bytes)}`);
    }

    return images;
}
