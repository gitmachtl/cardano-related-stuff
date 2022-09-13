const appname = "cardano-signer"
const version = "1.1.0"

const CardanoWasm = require("@emurgo/cardano-serialization-lib-nodejs")

const regExp = /^[0-9a-fA-F]+$/;

function showUsage(){
        console.log(``)
        console.log(`Usage Signing:`)
        console.log(``)
        console.log(`   ${appname} sign <data(hex)> <secret_key(hex)>`)
        console.log(``)
        console.log(`   Output: signature(hex) + public_key(hex)`)
        console.log(``)
        console.log(``)
        console.log(`Usage Verify:`)
        console.log(``)
        console.log(`   ${appname} verify <data(hex)> <signature_to_verify(hex)> <public_key(hex)>`)
        console.log(``)
        console.log(`   Output: true(exitcode 0) or false(exitcode 1)`)
        console.log(``)
        console.log(``)
        console.log(`Info:`)
        console.log(`   Brought to you by: https://github.com/gitmachtl \/\/ Cardano SPO Scripts \/\/ ATADA Stakepools Austria`)
        console.log(``)
        process.exit(1);
}

function trimString(s){
        s = s.replace(/(^\s*)|(\s*$)/gi,"");    //exclude start and end white-space
        s = s.replace(/\n /,"\n");              // exclude newline with a start spacing
        return s;
}

// MAIN
//
// first parameter -> workMode: sign or verify
//
// workMode: sign
//second parameter -> hexdata that should be signed
// third parameter -> signing key in hex format
//          output -> signed data in hex format + public key in hex format
//
// workMode: verify
//second parameter -> hexdata that should be verified
// third parameter -> signed data in hex format for verification
// forth parameter -> public key for verification
//          output -> true (exitcode 0) or false (exitcode 1)
async function main() {

        //show help or usage if no parameter
        if ( ! process.argv[2] || process.argv[2].toLowerCase().includes("help") ) { console.log(`${appname} ${version}`); showUsage(); }

        //show version
        if ( process.argv[2].toLowerCase().includes("version") ) { console.log(`${appname} ${version}`); process.exit(0); }

        //first paramter - workMode: "sign or verify"
        var workMode = process.argv[2];
        if ( ! workMode ) { showUsage(); }
        workMode = trimString(workMode.toLowerCase());

	//choose the workmode
        switch (workMode) {

                case "sign":  //SIGN DATA

			//get data to sign -> store it in sign_data
			var sign_data = process.argv[3];
		        if ( ! sign_data ) { showUsage(); }
		        sign_data = trimString(sign_data.toLowerCase());

			//check that the given data is a hex string
			if ( ! regExp.test(sign_data) ) { console.log(`Error: Data to sign is not a valid hex string`); showUsage(); }

			//get signing key -> store it in sign_key
			var sign_key = process.argv[4];
		        if ( ! sign_key ) { console.log(`Error: Missing secret key (hex)`); showUsage(); }
		        sign_key = trimString(sign_key.toLowerCase());

			//check that the given key is a hex string
			if ( ! regExp.test(sign_key) ) { console.log(`Error: Secret key is not a valid hex string`); showUsage(); }

			//load the private key (normal or extended)
			try {
			if ( sign_key.length <= 64 ) { var prvKey = CardanoWasm.PrivateKey.from_normal_bytes(Buffer.from(sign_key, "hex")); }
						else { var prvKey = CardanoWasm.PrivateKey.from_extended_bytes(Buffer.from(sign_key, "hex")); }
			} catch (error) { console.log(`Error: ${error}`); process.exit(1); }

			//generate the public key from the secret key for external verification
			const pubKey = Buffer.from(prvKey.to_public().as_bytes()).toString('hex')

			//sign the data
			try {
			var signedBytes = prvKey.sign(Buffer.from(sign_data, 'hex')).to_bytes();
			var signedData = Buffer.from(signedBytes).toString('hex');
			} catch (error) { console.log(`Error: ${error}`); process.exit(1); }

			//output the signed data and the public key
			console.log(signedData + " " + pubKey);
			break;



                case "verify":	//VERIFY DATA

			//get data to verify -> store it in verify_data
			var verify_data = process.argv[3];
		        if ( ! verify_data ) { showUsage(); }
		        verify_data = trimString(verify_data.toLowerCase());

			//check that the given data is a hex string
			if ( ! regExp.test(verify_data) ) { console.log(`Error: Data to verify is not a valid hex string`); showUsage(); }

			//get signed_data(signature) to verify -> store it in signed_data
			var signed_data = process.argv[4];
		        if ( ! signed_data ) { showUsage(); }
		        signed_data = trimString(signed_data.toLowerCase());

			//check that the given signed_data is a hex string
			if ( ! regExp.test(signed_data) ) { console.log(`Error: Signature(signed_data) is not a valid hex string`); showUsage(); }

			//get public key -> store it in public_key
			var public_key = process.argv[5];
		        if ( ! public_key ) { console.log(`Error: Missing public key (hex)`); showUsage(); }
		        public_key = trimString(public_key.toLowerCase());

			//check that the given key is a hex string
			if ( ! regExp.test(public_key) ) { console.log(`Error: Public key is not a valid hex string`); showUsage(); }

			//load the public key
			try {
			var publicKey = CardanoWasm.PublicKey.from_bytes(Buffer.from(public_key,'hex'));
			} catch (error) { console.log(`Error: ${error}`); process.exit(1); }

			//load the Ed25519Signature
			try {
			var ed25519signature = CardanoWasm.Ed25519Signature.from_hex(signed_data);
			} catch (error) { console.log(`Error: ${error}`); process.exit(1); }

			//do the verification
			const verified = publicKey.verify(Buffer.from(verify_data,'hex'),ed25519signature);

			//output the result and exit with the right exitcode
			if ( verified ) { console.log(`true`); process.exit(0); }
				   else { console.log(`false`); process.exit(1); }

			break;

		default:
		        //if workMode is not found exit with showUsage
			console.log(`Error: Unsupported command`);
			showUsage();

	} //switch

}

main();



