const appname = "cardano-signer"
const version = "1.4.0"

const CardanoWasm = require("@emurgo/cardano-serialization-lib-nodejs")
const cbor = require("cbor");
const fs = require("fs");
const args = require('minimist')(process.argv.slice(2));

const regExp = /^[0-9a-fA-F]+$/;

process.on('uncaughtException', function (error) {
    console.error(`${error}`); process.exit(1);
});


function showUsage(){
        console.log(``)
        console.log(`Signing a hexstring(data):`)
        console.log(``)
        console.log(`   Syntax: ${appname} sign`);
	console.log(`   Params: --data-hex "<hex_data>" | --data "<text>"     	data/payload to sign in hexformat or textformat`);
	console.log(`           --secret-key "<secretKey_file|secretKey_hex>"	path to a signing-key-file or a direct signing-hex-key string`);
	console.log(`           [--cip8]     					will enable CIP-8 compatible payload signing (also needs --address)`);
	console.log(`           [--address]  					signing address in CIP-8 mode (bech format like 'stake1_...')`);
	console.log(`           [--out-file "<path_to_file>"]			path to an output file (default: standard-output)`);
        console.log(`   Output: signature_hex + publicKey_hex`);
        console.log(``)
        console.log(``)
        console.log(`Verifying a hexstring(data)+signature+publicKey:`)
        console.log(``)
        console.log(`   Syntax: ${appname} verify`);
	console.log(`   Params: --data-hex "<data_hex>" | --data "<text>"     	data/payload to verify in hexformat or textformat`);
	console.log(`           --signature "<signature_hex>"			signature in hexformat`);
	console.log(`           --public-key "<publicKey_file|publicKey_hex>"	path to a public-key-file or a direct public-hex-key string`);
        console.log(`   Output: true(exitcode 0) or false(exitcode 1)`)
        console.log(``)
        console.log(``)
        console.log(`Info:`);
	console.log(`   https://github.com/gitmachtl (Cardano SPO Scripts \/\/ ATADA Stakepools Austria)`)
        console.log(``)
        process.exit(1);
}


function trimString(s){
        s = s.replace(/(^\s*)|(\s*$)/gi,"");    //exclude start and end white-space
        s = s.replace(/\n /,"\n");              // exclude newline with a start spacing
        return s;
}


function readKey2hex(key,type) { //reads a standard-cardano-skey/vkey-file-json or a direct hex entry // returns a hexstring of the key

	var key_hex = "";

	switch (type) {

		case "secret": //convert a secret key into a hex string

			// try to use the parameter as a filename for a cardano skey json with a cborHex entry
			try {
				const key_json = JSON.parse(fs.readFileSync(key)); //parse the given key as a json file
				const is_singing_key = key_json.type.toLowerCase().includes('signing') //boolean if the json contains the keyword 'signing' in the type field
				if ( ! is_singing_key ) { console.error(`Error: The file '${key}' is not a signing/secret key json`); process.exit(1); }
				key_hex = key_json.cborHex.substring(4).toLowerCase(); //cut off the leading "5820/5840" from the cborHex
				//check that the given key is a hex string
				if ( ! regExp.test(key_hex) ) { console.error(`Error: The secret key in file '${key}' entry 'cborHex' is not a valid hex string`); process.exit(1); }
				return key_hex;
			} catch (error) {}

			// try to use the parameter as a filename for a bech encoded string in it (typical keyfiles generated via jcli)
			try {
				const content = trimString(fs.readFileSync(key,'utf8')); //read the content of the given key from a file
				try { //try to load it as a bech secret key
					const tmp_key = CardanoWasm.PrivateKey.from_bech32(content); //temporary key to check about bech32 format
					key_hex = Buffer.from(tmp_key.as_bytes()).toString('hex');
				 } catch (error) { console.error(`Error: The content in file '${key}' is not a valid bech secret key`); process.exit(1); }
				return key_hex;
			} catch (error) {}

			// try to use the parameter as a direct hex string
			key_hex = trimString(key.toLowerCase());
			//check that the given key is a hex string
			if ( ! regExp.test(key) ) { console.error(`Error: Provided secret key is not a valid hex string, or the file is missing`); process.exit(1); }
			return key_hex;
			break;


		case "public": //convert a public key into a hex string

			// try to use the parameter as a filename for a cardano vkey json with a cborHex entry
			try {
				const key_json = JSON.parse(fs.readFileSync(key)); //parse the given key as a json file
				const is_verification_key = key_json.type.toLowerCase().includes('verification') //boolean if the json contains the keyword 'verification' in the type field
				if ( ! is_verification_key ) { console.error(`Error: The file '${key}' is not a verification/public key json`); process.exit(1); }
				key_hex = key_json.cborHex.substring(4).toLowerCase(); //cut off the leading "5820/5840" from the cborHex
				//check that the given key is a hex string
				if ( ! regExp.test(key_hex) ) { console.error(`Error: The public key in file '${key}' entry 'cborHex' is not a valid hex string`); process.exit(1); }
				return key_hex;
			} catch (error) {}

			// try to use the parameter as a filename for a bech encoded string in it (typical keyfiles generated via jcli)
			try {
				const content = trimString(fs.readFileSync(key,'utf8')); //read the content of the given key from a file
				try { //try to load it as a bech public key
					const tmp_key = CardanoWasm.PublicKey.from_bech32(content); //temporary key to check about bech32 format
					key_hex = Buffer.from(tmp_key.as_bytes()).toString('hex');
				 } catch (error) { console.error(`Error: The content in file '${key}' is not a valid bech public key`); process.exit(1); }
				return key_hex;
			} catch (error) {}

			// try to use the parameter as a direct hex string
			key_hex = trimString(key.toLowerCase());
			//check that the given key is a hex string
			if ( ! regExp.test(key) ) { console.error(`Error: Provided public key is not a valid hex string, or the file is missing`); process.exit(1); }
			return key_hex;
			break;

	} //switch (type)

}


// MAIN
//
// first parameter -> workMode: sign or verify
//
// workMode: sign
//          --data -> hexdata that should be signed
//    --secret-key -> signing key in hex format or the path to a file (json/txt)
//      --out-file -> signed data in hex format + public key in hex format
//
// workMode: verify
//          --data -> hexdata that should be verified
//     --signature -> signed data(signature) in hex format for verification
//    --public-key -> public key for verification or the path to a file (json/txt)
//          output -> true (exitcode 0) or false (exitcode 1)
async function main() {

        //show help or usage if no parameter is provided
        if ( ! process.argv[2] || process.argv[2].toLowerCase().includes('help') ) { console.log(`${appname} ${version}`); showUsage(); }

        //show version
        if ( process.argv[2].toLowerCase().includes('version') ) { console.log(`${appname} ${version}`); process.exit(0); }

        //first paramter - workMode: "sign or verify"
        var workMode = process.argv[2];
        if ( ! workMode ) { showUsage(); }
        workMode = trimString(workMode.toLowerCase());

	//choose the workmode
        switch (workMode) {

                case "sign":  //SIGN DATA

			//get data-hex to sign -> store it in sign_data_hex
			var sign_data_hex = args['data-hex'];
		        if ( typeof sign_data_hex === 'undefined' || sign_data_hex === true ) {

				//no data-hex parameter present, lets try the data parameter
				var sign_data = args['data'];
			        if ( typeof sign_data === 'undefined' || sign_data === true ) { console.error(`Error: Missing data / data-hex to sign`); showUsage();}

				//data parameter present, lets convert it to hex and store it in the sign_data_hex variable
				sign_data_hex = Buffer.from(sign_data).toString('hex');
			}
		        sign_data_hex = trimString(sign_data_hex.toLowerCase());

			//check that the given data is a hex string
			if ( ! regExp.test(sign_data_hex) ) { console.error(`Error: Data to sign is not a valid hex string`); showUsage(); }

			//CIP8-Flag-Check
                        //generate a new cip-8 conform payload data -> OVERWRITES sign_data_hex at the end !
                        const cip8_flag = args['cip8'];
                        if ( cip8_flag === true ) {

				//get signing address (stake or paymentaddress in bech format)
				var sign_addr = args['address'];
			        if ( typeof sign_addr === 'undefined' || sign_addr === true ) { console.error(`Error: Missing CIP-8 signing address (bech-format)`); showUsage(); }
			        sign_addr = trimString(sign_addr.toLowerCase());
				try {
					var sign_addr_hex = CardanoWasm.Address.from_bech32(sign_addr).to_hex();
				} catch (error) { console.error(`Error: The CIP-8 signing address '${sign_addr}' is not a valid bech address`); process.exit(1); }

				//generate the Signature1 inner cbor
				const signature1_cbor = Buffer.from(cbor.encode(new Map().set(1,-8).set('address',Buffer.from(sign_addr_hex,'hex')))).toString('hex')

				//generate the data to sign cbor -> overwrites the current sign_data_hex variable at the end
				const sign_data_array = [ "Signature1", Buffer.from(signature1_cbor,'hex'),Buffer.from(''), Buffer.from(sign_data_hex,'hex') ]

				//overwrite the sign_data_hex with the cbor encoded sign_data_array
				sign_data_hex = cbor.encode(sign_data_array).toString('hex');

                        } //CIP8-Flag


			//get signing key -> store it in sign_key
			var key_file_hex = args['secret-key'];
		        if ( typeof key_file_hex === 'undefined' || key_file_hex === true ) { console.error(`Error: Missing secret key parameter`); showUsage(); }

			//read in the key from a file or direct hex
		        sign_key = readKey2hex(key_file_hex, 'secret');

			//load the private key (normal or extended)
			try {
			if ( sign_key.length <= 64 ) { var prvKey = CardanoWasm.PrivateKey.from_normal_bytes(Buffer.from(sign_key, "hex")); }
						else { var prvKey = CardanoWasm.PrivateKey.from_extended_bytes(Buffer.from(sign_key.substring(0,128), "hex")); } //use only the first 64 bytes (128 chars)
			} catch (error) { console.log(`Error: ${error}`); process.exit(1); }

			//generate the public key from the secret key for external verification
			const pubKey = Buffer.from(prvKey.to_public().as_bytes()).toString('hex')

			//sign the data
			try {
			var signedBytes = prvKey.sign(Buffer.from(sign_data_hex, 'hex')).to_bytes();
			var signedData = Buffer.from(signedBytes).toString('hex');
			} catch (error) { console.error(`Error: ${error}`); process.exit(1); }

			//output the signed data and the public key
			var content = signedData + " " + pubKey;
			var out_file = args['out-file'];
		        //if there is no --out-file parameter specified or the parameter alone (true) then output to the console
			if ( typeof out_file === 'undefined' || out_file === true ) { console.log(content); }
			else { //else try to write the content out to the given file
				try {
				const outFile = fs.createWriteStream(out_file);
				outFile.write(content, 'utf8');
				outFile.end();
				// file written successfully
				} catch (error) { console.error(`${error}`); process.exit(1); }
			}
			break;



                case "verify":	//VERIFY DATA

			//get data-hex to verify -> store it in verify_data_hex
			var verify_data_hex = args['data-hex'];
		        if ( typeof verify_data_hex === 'undefined' || verify_data_hex === true ) {

				//no data-hex parameter present, lets try the data parameter
				var verify_data = args['data'];
			        if ( typeof verify_data === 'undefined' || verify_data === true ) { console.error(`Error: Missing data / data-hex to verify`); showUsage();}

				//data parameter present, lets convert it to hex and store it in the verify_data_hex variable
				verify_data_hex = Buffer.from(verify_data).toString('hex');
			}
		        verify_data_hex = trimString(verify_data_hex.toLowerCase());

			//check that the given data is a hex string
			if ( ! regExp.test(verify_data_hex) ) { console.error(`Error: Data to verify is not a valid hex string`); process.exit(1); }

			//get signed_data(signature) to verify -> store it in signed_data
			var signed_data = args['signature'];
		        if ( typeof signed_data === 'undefined' || signed_data === true ) { console.error(`Error: Missing signature`); showUsage(); }
		        signed_data = trimString(signed_data.toLowerCase());

			//check that the given signed_data is a hex string
			if ( ! regExp.test(signed_data) ) { console.error(`Error: Signature(signed_data) is not a valid hex string`); process.exit(1); }

			//get public key -> store it in public_key
			var key_file_hex = args['public-key'];
		        if ( typeof key_file_hex === 'undefined' || key_file_hex === true ) { console.error(`Error: Missing public key parameter`); showUsage(); }

			//read in the key from a file or direct hex
		        public_key = readKey2hex(key_file_hex, 'public');

			//load the public key
			try {
			var publicKey = CardanoWasm.PublicKey.from_bytes(Buffer.from(public_key.substring(0,64),'hex')); //only use the first 32 bytes (64 chars)
			} catch (error) { console.error(`Error: ${error}`); process.exit(1); }

			//load the Ed25519Signature
			try {
			var ed25519signature = CardanoWasm.Ed25519Signature.from_hex(signed_data);
			} catch (error) { console.error(`Error: ${error}`); process.exit(1); }

			//do the verification
			const verified = publicKey.verify(Buffer.from(verify_data_hex,'hex'),ed25519signature);

			//output the result and exit with the right exitcode
			if ( verified ) { console.log(`true`); process.exit(0); }
				   else { console.log(`false`); process.exit(1); }

			break;


		default:
		        //if workMode is not found, exit with and errormessage and showUsage
			console.error(`Error: Unsupported command`);
			showUsage();

	} //switch

}

main();

process.exit(0); //we're finished, exit with errorcode 0 (all good)


