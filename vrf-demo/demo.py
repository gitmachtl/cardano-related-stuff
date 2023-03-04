
# VRF Demonstration

import secrets
import ecvrf_edwards25519_sha512_elligator2

secret_key = bytearray.fromhex('adb9c97bec60189aa90d01d113e3ef405f03477d82a94f81da926c90cd46a374')
print(' Secret-Key: ', secret_key.hex())
public_key = ecvrf_edwards25519_sha512_elligator2.get_public_key(secret_key)
print(' Public-Key: ', public_key.hex())

challenge_string = bytearray.fromhex('6977c480a3acb4c838ba95bb84d1f4db1c2591ea6ebe5805ed0394f706c23b05')
print('  Challenge: ', challenge_string.hex())

# Generate Signature

p_status, signature_string = ecvrf_edwards25519_sha512_elligator2.ecvrf_prove(secret_key, challenge_string)
b_status, signature_hash_string = ecvrf_edwards25519_sha512_elligator2.ecvrf_proof_to_hash(signature_string)

print('  Signature: ', signature_string.hex())
print('   Sig-Hash: ', signature_hash_string.hex())

# Verify Signature

result, verify_hash_string = ecvrf_edwards25519_sha512_elligator2.ecvrf_verify(public_key, signature_string, challenge_string)
if result == 'VALID':
	print('Verify-Hash: ', verify_hash_string.hex())

if signature_hash_string == verify_hash_string:
	print("Signature OK")
else:
	print("Signature NOT OK")

