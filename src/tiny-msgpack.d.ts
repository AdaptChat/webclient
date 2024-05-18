/// <reference types="node" />
// Cherrypicked from <https://github.com/DefinitelyTyped/DefinitelyTyped/blob/master/types/msgpack-lite/index.d.ts>

declare module 'tiny-msgpack' {
  /**
   * encode from JS Object to MessagePack
   */
  export function encode(input: any, options?: EncoderOptions): Buffer;

  /**
   * decode from MessagePack to JS Object
   */
  export function decode(input: Buffer | Uint8Array | number[], options?: DecoderOptions): any;

  /**
   * The default built-in codec
   */
  export const codec: {
    /**
     * The default built-in codec
     */
    preset: Codec;
  };

  export interface Codec {
    /**
     * Register a custom extension to serialize your own class instances
     *
     * @param etype an integer within the range of 0 and 127 (0x0 and 0x7F)
     * @param Class the constructor of the type you wish to serialize
     * @param packer a function that converts an instance of T to bytes
     */
    addExtPacker<T>(
      etype: number,
      Class: new(...args: any[]) => T,
      packer: (t: T) => Buffer | Uint8Array,
    ): void;

    /**
     * Register a custom extension to deserialize your own class instances
     *
     * @param etype an integer within the range of 0 and 127 (0x0 and 0x7F)
     * @param unpacker a function that converts bytes to an instance of T
     */
    addExtUnpacker<T>(etype: number, unpacker: (data: Buffer | Uint8Array) => T): void;
  }

  export interface EncoderOptions {
    codec?: Codec | undefined;
  }

  export interface DecoderOptions {
    codec?: Codec | undefined;
  }
}