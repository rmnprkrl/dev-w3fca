const { encodeAddress, decodeAddress } = require('@polkadot/keyring');
const pUtil = require('@polkadot/util');
const Web3 = require('web3');

const { addClassVerified, removeClassVerified, addClassWaiting, removeClassWaiting } = require('./util');

const { createType, TypeRegistry } = require('@polkadot/types');
const { setSS58Format } = require('@polkadot/util-crypto');

setSS58Format(0);

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

const noClaimText = () => {
  document.getElementById('eth-address').innerHTML = 'No Claims for this address.';
  document.getElementById('pd-address').innerHTML = 'No Claims for this address.';
  document.getElementById('pubkey').innerHTML = 'No Claims for this address.';
  document.getElementById('index').innerHTML = 'No Claims for this address.';
  document.getElementById('balance').innerHTML = '0';
  document.getElementById('vesting').innerHTML = 'No Claims for this address.';
}

const handleToggle = (box) => {
  if (box.checked) {
    instantiateContracts('testnet');
  } else {
    instantiateContracts();
  }
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
    document.getElementById('next-index').innerHTML = `${m.toString()}`;
  })
  
  document.getElementById('contract-abi').innerHTML = JSON.stringify(ClaimsArtifact.abi);  
  document.getElementById('claims-address').innerHTML = config.claims;

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
  let { value } = document.getElementById('address-input');
  if (value.length !== 42 && value.length !== 66 && value.length !== 48 && value.length !== 47) {
    console.log('Wrong length input.');
    document.getElementById('eth-address').innerHTML = 'Unknown';
    document.getElementById('pd-address').innerHTML = 'None';
    document.getElementById('pubkey').innerHTML = 'None';
    document.getElementById('index').innerHTML = 'None';
    document.getElementById('balance').innerHTML = '0';
		document.getElementById('vesting').innerHTML = 'None';
		removeClassVerified('claim-verify');
    return;
  }

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
      return;
    }
  }

  const results = value.length === 42
    ? await getEthereumData(value, claims, frozenToken)
    : await getPolkadotData(value, claims, frozenToken);

  if (results.noBalance) {
		console.log("This account does not have balance. Are you sure you're using the right address?");
		removeClassWaiting('claim-verify');
    return;
  } else {
    // console.log('results', results);
    document.getElementById('eth-address').innerHTML = results.original == 'None' ? 'None' : results.original.join(', ');
    document.getElementById('pd-address').innerHTML = results.pdAddress;
    document.getElementById('pubkey').innerHTML = results.pubkey;
    document.getElementById('index').innerHTML = results.index;
    document.getElementById('balance').innerHTML = results.balance / 1000;
		document.getElementById('vesting').innerHTML = results.vesting ? results.vesting/1000 + ' DOT' : 'None';
		removeClassWaiting('claim-verify');
		addClassVerified('claim-verify');
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

  console.log('vLogs', vestedLogs);

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
  console.log('claimData', claimData);
  console.log('ethDAta', ethData);
  const { index, pubKey } = claimData;
  if (pubKey == '0x0000000000000000000000000000000000000000000000000000000000000000') {
    ethData.index = 'None';
    ethData.pubkey = 'Not claimed';
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
    noClaimText();
    removeClassWaiting('claim-verify');
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
