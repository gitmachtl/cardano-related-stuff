const appname = "cardano-signer"
const version = "1.6.0"

const CardanoWasm = require("@emurgo/cardano-serialization-lib-nodejs")
const cbor = require("cbor");
const fs = require("fs");
const blake2 = require('blake2');
const args = require('minimist')(process.argv.slice(2));

const regExp = /^[0-9a-fA-F]+$/;

//catch all exceptions that are not catched via try
process.on('uncaughtException', function (error) {
    console.error(`${error}`); process.exit(1);
});



function showUsage(){
        console.log(``)
        console.log(`Signing a hex/text-string or a binary-file:`)
        console.log(``)
        console.log(`   Syntax: ${appname} sign`);
	console.log(`   Params: --data-hex "<hex>" | --data "<text>" | --data-file "<path_to_file>"`);
	console.log(`								data/payload/file to sign in hexformat or textformat`);
	console.log(`           --secret-key "<path_to_file>|<hex>|<bech>"		path to a signing-key-file or a direct signing hex/bech-key string`);
	console.log(`           [--out-file "<path_to_file>"]			path to an output file, default: standard-output`);
        console.log(`   Output: signature_hex + publicKey_hex`);
        console.log(``)
        console.log(``)
        console.log(`Signing a payload in CIP-8 mode:`)
        console.log(``)
        console.log(`   Syntax: ${appname} sign --cip8`);
	console.log(`   Params: --data-hex "<hex>" | --data "<text>" | --data-file "<path_to_file>"`);
	console.log(`								data/payload/file to sign in hexformat or textformat`);
	console.log(`           --secret-key "<path_to_file>|<hex>|<bech>"		path to a signing-key-file or a direct signing hex/bech-key string`);
	console.log(`           --address "<bech_address>" 				signing address (bech format like 'stake1_...')`);
	console.log(`           [--out-file "<path_to_file>"]			path to an output file, default: standard-output`);
        console.log(`   Output: signature_hex + publicKey_hex`);
        console.log(``)
        console.log(``)
        console.log(`Signing a catalyst registration/delegation in CIP-36 mode:`)
        console.log(``)
        console.log(`   Syntax: ${appname} sign --cip36`);
	console.log(`   Params: --vote-public-key "<path_to_file>|<hex>|<bech>"	public-key-file or public hex/bech-key string to delegate the votingpower to`);
	console.log(`           --vote-weight <unsigned_int>				relative weight of the delegated votingpower, default: 1 (=100% for single delegation)`);
	console.log(`           --secret-key "<path_to_file>|<hex>|<bech>"		signing-key-file or a direct signing hex/bech-key string of the stake key (votingpower)`);
	console.log(`           --rewards-address "<bech_address>"			rewards stake address (bech format like 'stake1_...')`);
	console.log(`           --nonce <unsigned_int>				nonce value, this is typically the slotheight(tip) of the chain`);
	console.log(`           [--vote-purpose <unsigned_int>]			optional parameter (unsigned int), default: 0 (catalyst)`);
	console.log(`           [--out-file "<path_to_file>"]			path to write a binary metadata.cbor file to`);
        console.log(`   Output: registration_data_cbor_hex`);
        console.log(``)
        console.log(``)
        console.log(`Verifying a hex/text-string or a binary-file(data) via signature + publicKey:`)
        console.log(``)
        console.log(`   Syntax: ${appname} verify`);
	console.log(`   Params: --data-hex "<hex>" | --data "<text>" | --data-file "<path_to_file>"`);
	console.log(`								data/payload/file to verify in hexformat or textformat`);
	console.log(`           --signature "<hex>"					signature in hexformat`);
	console.log(`           --public-key "<path_to_file>|<hex>|<bech>"		path to a public-key-file or a direct public hex/bech-key string`);
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
				const key_json = JSON.parse(fs.readFileSync(key,'utf8')); //parse the given key as a json file
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

			// try to use the parameter as a bech encoded string
			try {
				const tmp_key = CardanoWasm.PrivateKey.from_bech32(key); //temporary key to check about bech32 format
				key_hex = Buffer.from(tmp_key.as_bytes()).toString('hex');
				return key_hex;
			} catch (error) {}

			// try to use the parameter as a direct hex string
			key_hex = trimString(key.toLowerCase());
			//check that the given key is a hex string
			if ( ! regExp.test(key) ) { console.error(`Error: Provided secret key '${key}' is not a valid secret key. Or not a hex string, bech encoded key, or the file is missing`); process.exit(1); }
			return key_hex;
			break;


		case "public": //convert a public key into a hex string

			// try to use the parameter as a filename for a cardano vkey json with a cborHex entry
			try {
				const key_json = JSON.parse(fs.readFileSync(key,'utf8')); //parse the given key as a json file
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

			// try to use the parameter as a bech encoded string
			try {
				const tmp_key = CardanoWasm.PublicKey.from_bech32(key); //temporary key to check about bech32 format
				key_hex = Buffer.from(tmp_key.as_bytes()).toString('hex');
				return key_hex;
			} catch (error) {}

			// try to use the parameter as a direct hex string
			key_hex = trimString(key.toLowerCase());
			//check that the given key is a hex string
			if ( ! regExp.test(key) ) { console.error(`Error: Provided public key '${key}' is not a valid public key. Or not a hex string, bech encoded key, or the file is missing`); process.exit(1); }
			return key_hex;
			break;

	} //switch (type)

}

function getHash(content) { //hashes a given hex-string content with blake2b_256 (digestLength 32)
    const h = blake2.createHash("blake2b", { digestLength: 32 });
    h.update(Buffer.from(content, 'hex'));
    return h.digest("hex")
}

// MAIN
//
// first parameter -> workMode: sign or verify
//
// workMode: sign (defaultmode without flags)
// --data / --data-hex -> textdata / hexdata that should be signed
//        --secret-key -> signing key in hex/bech/file format
//          --out-file -> signed data in hex format + public key in hex format
//
// workMode: sign --cip8 FLAG
// --data / --data-hex -> textdata / hexdata that should be signed
//        --secret-key -> signing key in hex/bech/file format
//           --address -> signing address
//          --out-file -> signed data in hex format + public key in hex format
//
// workMode: sign --cip36 FLAG
//   --vote-public-key -> public key in hex/bech/file format of the voting public key (one or multiple)
//       --vote-weight -> relative voting weight (one or multiple)
//        --secret-key -> signing key in hex/bech/file format
//   --rewards-address -> rewards stake address
//             --nonce -> nonce, typically the slotheight(tip) of the chain
//      --vote-purpose -> optional unsigned_int parameter, default: 0 (catalyst)
//          --out-file -> binary metadata.cbor file
//
// workMode: verify (defaultmode without flags)
// --data / --data-hex -> textdata / hexdata that should be verified
//         --signature -> signed data(signature) in hex format for verification
//        --public-key -> public key for verification in hex/bech/file format
//              output -> true (exitcode 0) or false (exitcode 1)
//

async function main() {

        //show help or usage if no parameter is provided
        if ( ! process.argv[2] || process.argv[2].toLowerCase().includes('help') ) { console.log(`${appname} ${version}`); showUsage(); }

        //show version
        if ( process.argv[2].toLowerCase().includes('version') ) { console.log(`${appname} ${version}`); process.exit(0); }

        //first paramter - workMode: "sign or verify"
        var workMode = process.argv[2];
        if ( ! workMode ) { showUsage(); }
        workMode = trimString(workMode.toLowerCase());

	//CIP8-Flag-Check
        const cip8_flag = args['cip8'];
        if ( cip8_flag === true ) {workMode = workMode + '-cip8'}

	//CIP36-Flag-Check
        const cip36_flag = args['cip36'];
        if ( cip36_flag === true ) {workMode = workMode + '-cip36'}

	//choose the workmode
        switch (workMode) {

                case "sign":  //SIGN DATA IN DEFAULT MODE

			//get data-hex to sign -> store it in sign_data_hex
			var sign_data_hex = args['data-hex'];
		        if ( typeof sign_data_hex === 'undefined' || sign_data_hex === true ) {

				//no data-hex parameter present, lets try the data parameter
				var sign_data = args['data'];
			        if ( typeof sign_data === 'undefined' || sign_data === true ) {

					//no data parameter present, lets try the data-file parameter
					var sign_data_file = args['data-file'];
				        if ( typeof sign_data_file === 'undefined' || sign_data_file === true ) {console.error(`Error: Missing data / data-hex / data-file to sign`); showUsage();}

					//data-file present lets read the file and store it hex encoded in sign_data_hex
					try {
						sign_data_hex = fs.readFileSync(sign_data_file,null).toString('hex'); //reads the file as binary
					} catch (error) { console.log(`Error: Can't read data-file '${sign_data_file}'`); process.exit(1); }

				} else {
				//data parameter present, lets convert it to hex and store it in the sign_data_hex variable
				sign_data_hex = Buffer.from(sign_data).toString('hex');
				}

			}
		        sign_data_hex = trimString(sign_data_hex.toLowerCase());

			//check that the given data is a hex string
			if ( ! regExp.test(sign_data_hex) ) { console.error(`Error: Data to sign is not a valid hex string`); showUsage(); }

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
			var pubKey = Buffer.from(prvKey.to_public().as_bytes()).toString('hex')

			//sign the data
			try {
			var signedBytes = prvKey.sign(Buffer.from(sign_data_hex, 'hex')).to_bytes();
			var signature = Buffer.from(signedBytes).toString('hex');
			} catch (error) { console.error(`Error: ${error}`); process.exit(1); }

			//output the signature data and the public key
			var content = signature + " " + pubKey;
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


                case "sign-cip8":  //SIGN DATA IN CIP-8 MODE

			//get data-hex to sign -> store it in sign_data_hex
			var sign_data_hex = args['data-hex'];
		        if ( typeof sign_data_hex === 'undefined' || sign_data_hex === true ) {

				//no data-hex parameter present, lets try the data parameter
				var sign_data = args['data'];
			        if ( typeof sign_data === 'undefined' || sign_data === true ) {

					//no data parameter present, lets try the data-file parameter
					var sign_data_file = args['data-file'];
				        if ( typeof sign_data_file === 'undefined' || sign_data_file === true ) {console.error(`Error: Missing data / data-hex / data-file to sign`); showUsage();}

					//data-file present lets read the file and store it hex encoded in sign_data_hex
					try {
						sign_data_hex = fs.readFileSync(sign_data_file,null).toString('hex'); //reads the file as binary
					} catch (error) { console.log(`Error: Can't read data-file '${sign_data_file}'`); process.exit(1); }

				} else {
				//data parameter present, lets convert it to hex and store it in the sign_data_hex variable
				sign_data_hex = Buffer.from(sign_data).toString('hex');
				}

			}
		        sign_data_hex = trimString(sign_data_hex.toLowerCase());

			//check that the given data is a hex string
			if ( ! regExp.test(sign_data_hex) ) { console.error(`Error: Data to sign is not a valid hex string`); showUsage(); }

			//get signing address (stake or paymentaddress in bech format)
			var sign_addr = args['address'];
		        if ( typeof sign_addr === 'undefined' || sign_addr === true ) { console.error(`Error: Missing CIP-8 signing address (bech-format)`); showUsage(); }
		        sign_addr = trimString(sign_addr.toLowerCase());
			try {
				var sign_addr_hex = CardanoWasm.Address.from_bech32(sign_addr).to_hex();
			} catch (error) { console.error(`Error: The CIP-8 signing address '${sign_addr}' is not a valid bech address`); process.exit(1); }

			//generate the Signature1 inner cbor (single signing key)
			const signature1_cbor = Buffer.from(cbor.encode(new Map().set(1,-8).set('address',Buffer.from(sign_addr_hex,'hex')))).toString('hex')

			//generate the data to sign cbor -> overwrites the current sign_data_hex variable at the end
			const sign_data_array = [ "Signature1", Buffer.from(signature1_cbor,'hex'),Buffer.from(''), Buffer.from(sign_data_hex,'hex') ]

			//overwrite the sign_data_hex with the cbor encoded sign_data_array
			sign_data_hex = cbor.encode(sign_data_array).toString('hex');

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
			var pubKey = Buffer.from(prvKey.to_public().as_bytes()).toString('hex')

			//sign the data
			try {
			var signedBytes = prvKey.sign(Buffer.from(sign_data_hex, 'hex')).to_bytes();
			var signature = Buffer.from(signedBytes).toString('hex');
			} catch (error) { console.error(`Error: ${error}`); process.exit(1); }

			//output the signature data and the public key
			var content = signature + " " + pubKey;
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


                case "sign-cip36":  //SIGN DATA IN CIP-36 MODE (Catalyst)

			//get rewards stakeaddress in bech format
			var rewards_addr = args['rewards-address'];
		        if ( typeof rewards_addr === 'undefined' || rewards_addr === true ) { console.error(`Error: Missing rewards stake address (bech-format)`); process.exit(1); }
		        rewards_addr = trimString(rewards_addr.toLowerCase());
			if ( rewards_addr.substring(0,5) != 'stake' ) { console.error(`Error: The rewards stake address '${rewards_addr}' is not a stake address`); process.exit(1); }
			try {
				var rewards_addr_hex = CardanoWasm.Address.from_bech32(rewards_addr).to_hex();
			} catch (error) { console.error(`Error: The rewards stake address '${rewards_addr}' is not a valid bech address`); process.exit(1); }

			//get signing key -> store it in sign_key
			var key_file_hex = args['secret-key'];
		        if ( typeof key_file_hex === 'undefined' || key_file_hex === true ) { console.error(`Error: Missing secret key parameter`); process.exit(1); }

			//read in the key from a file or direct hex
		        sign_key = readKey2hex(key_file_hex, 'secret');

			//load the private key (normal or extended)
			try {
			if ( sign_key.length <= 64 ) { var prvKey = CardanoWasm.PrivateKey.from_normal_bytes(Buffer.from(sign_key, "hex")); }
						else { var prvKey = CardanoWasm.PrivateKey.from_extended_bytes(Buffer.from(sign_key.substring(0,128), "hex")); } //use only the first 64 bytes (128 chars)
			} catch (error) { console.log(`Error: ${error}`); process.exit(1); }

			//generate the public key from the secret key for external verification
			var pubKey = Buffer.from(prvKey.to_public().as_bytes()).toString('hex')

			//get deleg vote public key(s) -> store it in vote_public_key
			var vote_public_key = args['vote-public-key'];
		        if ( typeof vote_public_key === 'undefined' || vote_public_key === true ) { console.error(`Error: Missing vote public key(s) parameter`); process.exit(1); }

			//if there is only one --vote-public-key parameter present, convert it to an array
		        if ( typeof vote_public_key === 'string' ) { vote_public_key = [ vote_public_key ]; }
		        if ( typeof vote_public_key === 'number' || vote_public_key === true ) { console.error(`Error: You've provided a number as a public key`); process.exit(1); }

			//get deleg voting weight -> store it in vote_weight
			var vote_weight = args['vote-weight'];
		        if ( typeof vote_weight === 'undefined' ) { vote_weight = 1 }
			if ( vote_weight === true ) { console.error(`Error: Please specify a --vote-weight parameter with an unsigned integer value > 0`); process.exit(1); }

			//if there is only one --vote-weight parameter present, convert it to an array
		        if ( typeof vote_weight === 'number' ) { vote_weight = [ vote_weight ]; }

			//if not the same amounts of vote_public_keys and vote_weights provided, show an error
			if ( vote_public_key.length != vote_weight.length ) { console.error(`Error: Not the same count of --vote-public-key(` + vote_public_key.length + `) and --vote-weight(` + vote_weight.length + `) parameters`); process.exit(1); }

			//build the vote_delegation array
			const vote_delegation_array = [];
			for (let cnt = 0; cnt < vote_public_key.length; cnt++) {
				entry_vote_public_key = vote_public_key[cnt]
			        if ( typeof entry_vote_public_key === 'number' || entry_vote_public_key === true ) { console.error(`Error: Invalid public key parameter found, please use a filename or a hex string`); process.exit(1); }
				entry_vote_public_key_hex = readKey2hex(entry_vote_public_key, 'public');
				entry_vote_weight = vote_weight[cnt] + 0;
				if (typeof entry_vote_weight !== 'number' || entry_vote_weight <= 0) { console.error(`Error: Please specify a --vote-weight parameter with an unsigned integer value > 0`); process.exit(1); }
				vote_delegation_array.push([Buffer.from(entry_vote_public_key_hex.substring(0,64),'hex'),entry_vote_weight]) //during the push, only use the first 32bytes (64chars) of the public_key_hex
			}

			//get the --nonce parameter
			var nonce = args['nonce'];
		        if ( typeof nonce !== 'number' || nonce === true ) { console.error(`Error: Please specify a --nonce parameter with an unsigned integer value`); process.exit(1); }

			//get the --vote-purpose parameter, set default = 0
			var vote_purpose_param = args['vote-purpose'];

		        if ( typeof vote_purpose_param === 'undefined' ) { vote_purpose = 0 }  //if not defined, set it to default=0
		        else if ( typeof vote_purpose_param === 'number' && vote_purpose_param >= 0 ) { vote_purpose = vote_purpose_param }
			else { console.error(`Error: Please specify a --vote-purpose parameter with an unsigned integer value`); process.exit(1); }

			/*
			build the delegation map
			61284: {
				  // delegations - CBOR byte array(s) of the voting_public_keys and the relative voting_weight
				  1: [["0xa6a3c0447aeb9cc54cf6422ba32b294e5e1c3ef6d782f2acff4a70694c4d1663", 1], ["0x00588e8e1d18cba576a4d35758069fe94e53f638b6faf7c07b8abd2bc5c5cdee", 3]],
				  // stake_pub - CBOR byte array
				  2: "0xad4b948699193634a39dd56f779a2951a24779ad52aa7916f6912b8ec4702cee",
				  // reward_address - CBOR byte array
				  3: "0x00588e8e1d18cba576a4d35758069fe94e53f638b6faf7c07b8abd2bc5c5cdee47b60edc7772855324c85033c638364214cbfc6627889f81c4",
				  // nonce
				  4: 5479467
				  // voting_purpose: 0 = Catalyst
				  5: 0
			}
			*/
			const delegationMap = new Map().set(61284,new Map().set(1,vote_delegation_array).set(2,Buffer.from(pubKey,'hex')).set(3,Buffer.from(rewards_addr_hex,'hex')).set(4,nonce).set(5,vote_purpose));

			//convert it to a cbor hex string
			const delegationCBOR = Buffer.from(cbor.encode(delegationMap)).toString('hex');

			//hash the delegationCBOR hex string
			sign_data_hex = getHash(delegationCBOR);

			//sign the data
			try {
			var signedBytes = prvKey.sign(Buffer.from(sign_data_hex, 'hex')).to_bytes();
			var signature = Buffer.from(signedBytes).toString('hex');
			} catch (error) { console.error(`Error: ${error}`); process.exit(1); }

			//build the full registration map by adding the root key 61285 and the signature in key 1 below that
			const registrationMap = delegationMap.set(61285,new Map().set(1,Buffer.from(signature,'hex')))

			//convert it to a cbor hex string
			const registrationCBOR = Buffer.from(cbor.encode(registrationMap)).toString('hex');

			//output the registrationCBOR or write it to a binary file
			var out_file = args['out-file'];
		        //if there is no --out-file parameter specified or the parameter alone (true) then output to the console
			if ( typeof out_file === 'undefined' || out_file === true ) { console.log(registrationCBOR); }
			else { //else try to write the content out to the given file
				try {
				var writeBuf = Buffer.from(registrationCBOR,'hex')
				fs.writeFileSync(out_file, writeBuf, 'binary')
				} catch (error) { console.error(`${error}`); process.exit(1); }
			}
			break;


                case "verify":	//VERIFY DATA IN DEFAULT MODE

			//get data-hex to verify -> store it in verify_data_hex
			var verify_data_hex = args['data-hex'];
		        if ( typeof verify_data_hex === 'undefined' || verify_data_hex === true ) {

				//no data-hex parameter present, lets try the data parameter
				var verify_data = args['data'];
			        if ( typeof verify_data === 'undefined' || verify_data === true ) {

					//no data parameter present, lets try the data-file parameter
					var verify_data_file = args['data-file'];
				        if ( typeof verify_data_file === 'undefined' || verify_data_file === true ) {console.error(`Error: Missing data / data-hex / data-file to verify`); showUsage();}

					//data-file present lets read the file and store it hex encoded in verify_data_hex
					try {
						verify_data_hex = fs.readFileSync(verify_data_file,null).toString('hex'); //reads the file as binary
					} catch (error) { console.log(`Error: Can't read data-file '${verify_data_file}'`); process.exit(1); }

				} else {
				//data parameter present, lets convert it to hex and store it in the verify_data_hex variable
				verify_data_hex = Buffer.from(verify_data).toString('hex');
				}

			}
		        verify_data_hex = trimString(verify_data_hex.toLowerCase());

			//check that the given data is a hex string
			if ( ! regExp.test(verify_data_hex) ) { console.error(`Error: Data to verify is not a valid hex string`); process.exit(1); }

			//get the signature to verify -> store it in signature
			var signature = args['signature'];
		        if ( typeof signature === 'undefined' || signature === true ) { console.error(`Error: Missing signature`); showUsage(); }
		        signature = trimString(signature.toLowerCase());

			//check that the given signature is a hex string
			if ( ! regExp.test(signature) ) { console.error(`Error: Signature is not a valid hex string`); process.exit(1); }

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
			var ed25519signature = CardanoWasm.Ed25519Signature.from_hex(signature);
			} catch (error) { console.error(`Error: ${error}`); process.exit(1); }

			//do the verification
			const verified = publicKey.verify(Buffer.from(verify_data_hex,'hex'),ed25519signature);

			//output the result and exit with the right exitcode
			if ( verified ) { console.log(`true`); process.exit(0); }
				   else { console.log(`false`); process.exit(1); }

			break;


		default:
		        //if workMode is not found, exit with and errormessage and showUsage
			console.error(`Error: Unsupported command '${workMode}'`);
			showUsage();

	} //switch

}

main();

process.exit(0); //we're finished, exit with errorcode 0 (all good)


