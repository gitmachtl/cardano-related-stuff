const appname = "cardano-signer"
const version = "1.0.0"

const CardanoWasm = require("@emurgo/cardano-serialization-lib-nodejs")

const regExp = /^[0-9a-fA-F]+$/;

function showUsage(){
        console.log(``)
        console.log(`Usage:`)
        console.log(`   ${appname} data_to_sign(hex) secret_key(hex)`)
        console.log(``)
        console.log(`Output:`)
        console.log(`   signed_data(hex) + public_key(hex)`)
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
// first parameter -> hexdata that should be signed
//second parameter -> signing key in hex format
//
//          output -> signed data in hex format + public key in hex format
//
async function main() {

        //show help or usage if no parameter
        if ( ! process.argv[2] || process.argv[2].toLowerCase().includes("help") ) { console.log(`${appname} ${version}`); showUsage(); }

        //show version
        if ( process.argv[2].toLowerCase().includes("version") ) { console.log(`${appname} ${version}`); process.exit(0); }

	//get data to sign -> store it in sign_data
	var sign_data = process.argv[2];
        if ( ! sign_data ) { showUsage(); }
        sign_data = trimString(sign_data.toLowerCase());

	//check that the given data is a hex string
	if ( ! regExp.test(sign_data) ) { console.log(`Error: Data to sign is not a valid hex string`); showUsage(); }

	//get signing key -> store it in sign_key
	var sign_key = process.argv[3];
        if ( ! sign_key ) { console.log(`Error: Missing secret key (hex)`); showUsage(); }
        sign_key = trimString(sign_key.toLowerCase());

	//check that the given key is a hex string
	if ( ! regExp.test(sign_key) ) { console.log(`Error: Secret key is not a valid hex string`); showUsage(); }

	//load the private key (normal or extended)
	try {
	if ( sign_key.length <= 64 ) {	var prvKey = CardanoWasm.PrivateKey.from_normal_bytes(Buffer.from(sign_key, "hex")); }
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
}

main();



