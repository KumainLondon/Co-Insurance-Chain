import { Name, Buying, N } from './src/contracts/buying'
import { bsv, TestWallet, DefaultProvider, toByteString, FixedArray } from 'scrypt-ts'

import * as dotenv from 'dotenv'

// Load the .env file
dotenv.config()

// Read the private key from the .env file.
// The default private key inside the .env file is meant to be used for the Bitcoin testnet.
// See https://scrypt.io/docs/bitcoin-basics/bsv/#private-keys
const privateKey = bsv.PrivateKey.fromWIF(process.env.PRIVATE_KEY || '')

// Prepare signer. 
// See https://scrypt.io/docs/how-to-deploy-and-call-a-contract/#prepare-a-signer-and-provider
const signer = new TestWallet(privateKey, new DefaultProvider({
    network: bsv.Networks.testnet
}))

async function main() {
    await Buying.compile()

    const insuranceNames: FixedArray<Name, typeof N> = [
        toByteString('iPhone', true),
        toByteString('Android', true),
        toByteString('Android', true)
    ]

    const instance = new Buying(
        insuranceNames
    )

    // Connect to a signer.
    await instance.connect(signer)

    // Contract deployment.
    const amount = 100
    const deployTx = await instance.deploy(amount)
    console.log('Buying contract deployed: ', deployTx.id)
}

main()
