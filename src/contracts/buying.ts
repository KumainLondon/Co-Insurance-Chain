import { assert, ByteString, hash256, method, prop, SmartContract, FixedArray, fill, toByteString } from 'scrypt-ts'

export type Name = ByteString

export type Insurance = {
    name: Name
    Received: bigint
}

export const N = 3

export type Insurances = FixedArray<Insurance, typeof N>

export class Buying extends SmartContract {
    @prop(true)
    insurances: Insurances

    constructor(names: FixedArray<Name, typeof N>) {
        super(...arguments)
        // initialize fixed array
        this.insurances = fill({
            name: toByteString(''),
            Received: 0n,
        }, N)
        // set names and set orders to 0
        for (let i = 0; i < N; i++) {
            this.insurances[i] = {
                name: names[i],
                Received: 0n,
            }
        }
    }

    /**
     * order an insurance
     * @param name a insurance
     */
    @method()
    public buy(name: Name) {
        this.increase(name)
        // output containing the latest state and the same balance
        let outputs: ByteString = this.buildStateOutput(this.ctx.utxo.value)
        if (this.changeAmount > 0n) {
            outputs += this.buildChangeOutput()
        }
        assert(this.ctx.hashOutputs === hash256(outputs), 'hashOutputs mismatch')
    }

    @method()
    increase(name: Name): void {
        for (let i = 0; i < N; i++) {
            if (this.insurances[i].name === name) {
                this.insurances[i].Received++
            }
        }
    }
}
