const { encodeAddress, decodeAddress } = require('@polkadot/keyring');
const pUtil = require('@polkadot/util');
const Web3 = require('web3');

const { addClassVerified, removeClassVerified, addClassWaiting, removeClassWaiting } = require('./util');

const { createType, TypeRegistry } = require('@polkadot/types');
const { setSS58Format } = require('@polkadot/util-crypto');

const { ApiPromise, WsProvider } = require("@polkadot/api");

setSS58Format(0);

let lock = false;
let cachedValue = '';

const ClaimsArtifact = require('../contracts/Claims.json');
const FrozenTokenArtifact = require('../contracts/FrozenToken.json');

const Config = {
  mainnet: {
    infura: 'wss://mainnet.infura.io/ws/v3/d2e0f554436c4ec595954c34d9fecdb7',
    claims: '0xa2CBa0190290aF37b7e154AEdB06d16100Ff5907',
    frozenToken: '0xb59f67A8BfF5d8Cd03f6AC17265c550Ed8F33907',
  },
  testnet: {
    infura: 'wss://goerli.infura.io/ws/v3/7121204aac9a45dcb9c2cc825fb85159',
    claims: '0x46f8131Dd26E59F1f81299A8702B7cA3bD2B2535',
    frozenToken: '0xe4915b22A00f293ed49AeA9aD97738dE8BfB3949',
  }
}

async function hasClaimedOnPd(addr) {
  console.log("being called with ", addr)

  if (!addr) return;

  const api = await ApiPromise.create({
    provider: new WsProvider("wss://rpc.polkadot.io"),
  });

  let claim;
  if (addr.startsWith("0x")) {
    claim = await api.query.claims.claims(addr);
  } else {
    const ethAddr = await api.query.claims.preclaims(addr);
    claim = await api.query.claims.claims(ethAddr.toString());
  }

  if (Number(claim.toString()) !== 0) {
    return false;
  }

  return true;
}

const noClaimText = async (pubkey) => {
  addClassWaiting('claim-verify');

  const addr = encodeAddress(pUtil.hexToU8a(pubkey), 0);

  const api = await ApiPromise.create({
    provider: new WsProvider("wss://rpc.polkadot.io"),
  });

  const attested = await hasClaimedOnPd(addr);

  const ethAddr = await api.query.claims.preclaims(addr);

  let bal = attested
    ? (await api.query.system.account(addr)).toJSON().data.free/10**12
    : 0;

  let vesting = attested
    ? (await api.query.vesting.vesting(addr)).toJSON()
    : null;

  document.getElementById('eth-address').innerHTML = "There was no claim for this address on Ethereum.";
  document.getElementById('pd-address').innerHTML = addr;
  document.getElementById('pubkey').innerHTML = pubkey;
  document.getElementById('index').innerHTML = "unknown";
  document.getElementById('balance').innerHTML = bal.toString();
  document.getElementById('vesting').innerHTML = vesting !== null ? vesting.locked/10**12 : "None";
  document.getElementById('attested').innerHTML = attested ? "Yes" : "No"
  removeClassWaiting('claim-verify');
  if (attested) addClassVerified('claim-verify');
  lock = false;
}

const handleToggle = (box) => {
  if (box.checked) {
    instantiateContracts('testnet');
  } else {
    instantiateContracts();
  }
}

const detectASCII = (pubkey) => {
  let chars = [];
  for (let i = 0; i < pubkey.length; i+=2) {
    const cur = pubkey.slice(i, i+2);
    if (cur === '0x') continue;
    else chars.push(String.fromCharCode('0x'+ cur));
  }

		const maybeAddress = chars.join('');
		const isASCII = /^[a-z0-9]+$/i.test(maybeAddress);

		return isASCII;
}

const instantiateContracts = (network = 'mainnet') => {
  console.log(`instantiating contracts for ${network}`);

  const config = Config[network];
  const w3 = new Web3(new Web3.providers.WebsocketProvider(config.infura));
  const frozenToken = new w3.eth.Contract(FrozenTokenArtifact.abi, config.frozenToken);
  const claims = new w3.eth.Contract(ClaimsArtifact.abi, config.claims);

  claims.methods.claimedLength().call((err, res) => {
    if (err) {
      console.log(err);
      return;
    }
    document.getElementById('total-claims').innerHTML = res;
  })
  
  claims.methods.nextIndex().call((err, res) => {
    if (err) {
      console.log(err);
      return;
    }
  
    const registry = new TypeRegistry();
    const m = createType(registry, 'AccountIndex', Number(res));
  })
  
  window.w3 = w3;
  window.claims = claims;
  window.frozenToken = frozenToken;
  console.log('instantiated contracts for', network);
}

instantiateContracts();

const validAddress = async () => {
  let { value } = document.getElementById('validity-input');
  if (value.length !== 42) {
		document.getElementById('validity-statement').innerHTML = 'Not a valid Ethereum address.';
		removeClassVerified('verify-ethereum-address');
			return;
  }

  const { claims, frozenToken } = window;

  if (!frozenToken || !claims) {
    console.log('Contracts are not instatiated. There is likely a problem with the Node connection.');
    return;
  }

  let ethData = {
    original: value,
    amendedTo: null,
  };

  const amendedToLogs = await claims.getPastEvents('Amended', {
    fromBlock: '9200000',
    toBlock: 'latest',
    filter: {
      original: [ethData.original],
      // amendedTo: [ethData.original],
    },
  });

  if (amendedToLogs && amendedToLogs.length && ethData.original !== '0x00b46c2526e227482e2EbB8f4C69E4674d262E75') {
    const {original, amendedTo} = amendedToLogs[0].returnValues;
    ethData.original = original;
    ethData.amendedTo = amendedTo;
  }

  const amendedForLogs = await claims.getPastEvents('Amended', {
    fromBlock: '9200000',
    toBlock: 'latest',
    filter: {
      // original: [ethData.original],
      amendedTo: [ethData.original],
    },
  });

  if (amendedForLogs && amendedForLogs.length && ethData.original !== '0x00b46c2526e227482e2EbB8f4C69E4674d262E75') {
    const {original, amendedTo} = amendedForLogs[0].returnValues;
    ethData.original = original;
    ethData.amendedTo = amendedTo;
  }
  // console.log(amendedLogs)

  ethData.balance = await frozenToken.methods.balanceOf(ethData.original).call();
  if (ethData.amendedTo) {
    // Necessary to check for any balance of the amended to address too.
    ethData.balance = Number(ethData.balance) + (await frozenToken.methods.balanceOf(ethData.amendedTo).call());
  }

  if (Number(ethData.balance) === 0 || (ethData.amendedTo && !amendedForLogs.length)) {
		document.getElementById('validity-statement').innerHTML = "There is not a claim associated with this address. Did you use the right one?"
		removeClassVerified('verify-ethereum-address');
  } else if (amendedForLogs.length) {
		document.getElementById('validity-statement').innerHTML = `${ethData.original} is amended to ${ethData.amendedTo}. Only the amended address can make the claim.`;
		removeClassVerified('verify-ethereum-address');
  } else {
		document.getElementById('validity-statement').innerHTML = "You have a claim! Please proceed with the next step!";
		addClassVerified('verify-ethereum-address');
  }
}

const check = async () => {
  if (lock) {
    console.log("Locked, waiting for the return values from already sent requests.");
    return;
  }

  let { value } = document.getElementById('address-input');
  if (cachedValue == value) {
    console.log('cached value');
    return;
  }

  removeClassWaiting('claim-verify');
  removeClassVerified('claim-verify');

  if (value.length !== 42 && value.length !== 66 && value.length !== 48 && value.length !== 47) {
    // console.log('Wrong length input.');
    document.getElementById('eth-address').innerHTML = 'Unknown';
    document.getElementById('pd-address').innerHTML = 'None';
    document.getElementById('pubkey').innerHTML = 'None';
    document.getElementById('index').innerHTML = 'None';
    document.getElementById('balance').innerHTML = '0';
		document.getElementById('vesting').innerHTML = 'None';
		removeClassVerified('claim-verify');
    return;
  }

  lock = true;
  cachedValue = value;

  const { claims, frozenToken } = window;
  if (!frozenToken || !claims) {
    console.log('Contracts are not instatiated. There is likely a problem with the Node connection.');
    return;
  }

  if (value.length === 48 || value.length === 47) {
    try {
			addClassWaiting('claim-verify');
      value = pUtil.u8aToHex(decodeAddress(value, 0));
    } catch (err) {
      console.log(err);
			console.log('error decoding polkadot address', value);
      removeClassWaiting('claim-verify');
      lock = false;
      return;
    }
  }

  const results = value.length === 42
    ? await getEthereumData(value, claims, frozenToken)
    : await getPolkadotData(value, claims, frozenToken);

  const { pdAddress, original, pubkey } = results;

  let attested = false;
  if ((pdAddress.toLowerCase() !== 'none' && pdAddress.toLowerCase() !== 'not claimed')) {
    attested = await hasClaimedOnPd(pdAddress);
  } else if (pdAddress.toLowerCase("not claimed") && typeof original !== 'string') {
    attested = await hasClaimedOnPd(original[0])
  }

  if (results.noBalance) {
		console.log("This account does not have balance. Are you sure you're using the right address?");
    removeClassWaiting('claim-verify');
    lock = false;
    return;
  } else {
    document.getElementById('eth-address').innerHTML = results.original == 'None' ? 'None' : results.original.join(', ');
    document.getElementById('pd-address').innerHTML = (attested && pdAddress.toLowerCase() === "not claimed") ? "Claimed on Polkadot": pdAddress;
    document.getElementById('pubkey').innerHTML = (attested && pubkey.toLowerCase() === 'not claimed') ? "Claimed on Polkadot": pubkey;
    document.getElementById('index').innerHTML = results.index;
    document.getElementById('balance').innerHTML = results.balance / 1000;
    document.getElementById('vesting').innerHTML = results.vesting ? results.vesting/1000 + ' DOT' : 'None';
    document.getElementById('attested').innerHTML = attested ? "Yes" : "No"
		removeClassWaiting('claim-verify');
    addClassVerified('claim-verify');
    lock = false;
  }
}

// This takes the length 42 string.
const getEthereumData = async (ethAddress, claims, frozenToken, ignoreAmendment) => {
  let ethData = {
    original: [ethAddress],
    amendedTo: null,
    balance: null,
    vesting: null,
    noBalance: false,
  };

  const amendedToLogs = await claims.getPastEvents('Amended', {
    fromBlock: '9200000',
    toBlock: 'latest',
    filter: {
      original: ethData.original,
      // amendedTo: [ethData.original],
    },
  });

  if (amendedToLogs && amendedToLogs.length && ethData.original[0] !== '0x00b46c2526e227482e2EbB8f4C69E4674d262E75') {
    const {original, amendedTo} = amendedToLogs[0].returnValues;
    ethData.original = [original];
    ethData.amendedTo = amendedTo;
  }

  if (ethData.amendedTo && !ignoreAmendment) {
    return {
      original: 'None',
      pdAddress: 'None',
      pubkey: 'None',
      index: 'None',
      balance: '0',
      vesting: null,
    }
  }

  const amendedForLogs = await claims.getPastEvents('Amended', {
    fromBlock: '9200000',
    toBlock: 'latest',
    filter: {
      // original: [ethData.original],
      amendedTo: ethData.original,
    },
  });

  if (amendedForLogs && amendedForLogs.length && ethData.original[0] !== '0x00b46c2526e227482e2EbB8f4C69E4674d262E75') {
    const {original, amendedTo} = amendedForLogs[0].returnValues;
    ethData.original = [original];
    ethData.amendedTo = amendedTo;
  }

  ethData.balance = await frozenToken.methods.balanceOf(ethData.original[0]).call();

  if (Number(ethData.balance) === 0) {
    return { noBalance: true, };
  }

  const vestedLogs = await claims.getPastEvents('Vested', {
    fromBlock: '9200000',
    toBlock: 'latest',
    filter: {
      eth: ethData.original,
    }
  });

  if (vestedLogs && vestedLogs.length) {
    ethData.vesting = vestedLogs[0].returnValues.amount;
  }

  const vestedIncreasedLogs = await claims.getPastEvents('VestedIncreased', {
    fromBlock: '9200000',
    toBlock: 'latest',
    filter: {
      eth: ethData.original,
    }
  });

  if (vestedIncreasedLogs && vestedIncreasedLogs.length) {
    ethData.vesting = vestedIncreasedLogs[vestedIncreasedLogs.length-1].returnValues.newTotal;
  }

  const claimData = await claims.methods.claims(ethData.original[0]).call();

  const { index, pubKey } = claimData;
  if (pubKey == '0x0000000000000000000000000000000000000000000000000000000000000000') {
    ethData.index = 'None';
    ethData.pubkey = 'Not claimed';
    ethData.pdAddress = 'Not claimed';
  } else if (detectASCII(pubKey)) {
    ethData.index  = 'None';
    ethData.pubkey = "We've detected an invalid claim. You will be able to make a new claim after Polkadot launch by signing a message from your Ethereum address.";
    ethData.pdAddress = 'Not claimed';
  } else {
    const registry = new TypeRegistry();
    const m = createType(registry, 'AccountIndex', Number(index));
    ethData.index = `${index} (${m.toString()})`;
    ethData.pubkey = pubKey;
    ethData.pdAddress = encodeAddress(pUtil.hexToU8a(pubKey), 0);
  }

  ethData.balance = Number(ethData.balance);
  if (ethData.vesting) {
    ethData.vesting = Number(ethData.vesting);
  }
  return ethData;
}

const getPolkadotData = async (pubkey, claims, frozenToken) => {
  const zeroAddress = '0x' + '00'.repeat(20);

  let claimsForPubkey;
  try {
    claimsForPubkey = await claims.methods.claimsForPubkey(pubkey, 0).call();
  } catch (err) {
    noClaimText(pubkey);
  }
  let accumulated = await getEthereumData(claimsForPubkey, claims, frozenToken, true);
  let counter = 0;
  while (claimsForPubkey != zeroAddress) {
    counter++;
    try {
      claimsForPubkey = await claims.methods.claimsForPubkey(pubkey, counter).call();
    } catch (err) { break; }
    if (claimsForPubkey == zeroAddress) break;
    await new Promise((resolve) => setTimeout(() => resolve()), 500);
    const data = await getEthereumData(claimsForPubkey, claims, frozenToken, true);
    console.log('DATA', data)
    accumulated.balance += data.balance || 0;
    accumulated.vesting += data.vesting || 0;
    accumulated.original.push(...data.original);
    console.log('ACCUM', accumulated)
  }
  console.log('returning accumulated', accumulated)
  return accumulated;
}

window.infoBoxChecker = check;
window.validAddress = validAddress;
window.handleToggle = handleToggle;

// npx browserify infobox.js > infobox-browser.js; npx uglify-es --mangle --compress -- infobox-browser.js > infobox.min.js; rm infobox-browser.js
