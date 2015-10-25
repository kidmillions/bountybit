var request = require('request');
var _ = require('lodash');
var Wallet = require('../models/Wallets');
var User = require('../models/User');
var Bounty = require('../models/Bounties');
var rk = require('random-key');

/**
 * GET /createwallet
 * Create wallet form.
 */
exports.createWallet = function(req, res, next) {
  res.render('wallet/new', {
    title: 'Create Wallet'
  });
};

exports.postWallet = function(req, res, next) {

  //gen random password for bounty wallets, bountyID passed from .postBounty()
  var pw;
  var ownerType = 'user';
  if (req.bountyID) {
    pw = rk.generate(20);
    ownerType = 'bounty';
  }


  var options = {
    url: 'https://blockchain.info/api/v2/create_wallet',
    method: 'POST',
    form: {
      password: pw || "dogjumpedovermoon",
      api_code: 'f1161a96-5e74-48ea-94b9-d0ff72247533'
    },
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  };

  request(options, function(error, response, body) {
    if (error) {
      return console.error('error: ', error);
    }
    if(!error && response.statusCode == 200) {
      var data = JSON.parse(body);
      var wallet = new Wallet({
        guid: data.guid,
        address: data.address,
        link: data.link,
        ownerType: ownerType
      });
      wallet.save(function(err, saved) {
        if (err) {
          return console.error('error saving wallet: ', err);
        }

        req.walletID = saved.id;
        next();

      });
    }
  });
};


exports.connectWalletToUser = function(req, res) {
  Wallet.findById(req.walletID).exec(function(err, wallet) {
    User.findByIdAndUpdate(req.user.id, {
      wallet: wallet
    }, function(err, user) {
      if (err) {
        return console.error('error updating user: ', err);
      }

      wallet._userOwner = user;
      wallet.save(function(err, saved) {
        if (err) {
          return console.err('error updating wallet to user asso: ', err);
        }
        console.log('saved it all');
        res.json(saved);
      });
    });
  });
};

exports.connectWalletToBounty = function(req, res) {
  Wallet.findById(req.walletID).exec(function(err, wallet) {
    Bounty.findByIdAndUpdate(req.bountyID, {
      wallet: wallet
    }, function(err, bounty) {
      if (err) {
        return console.error('error updating bounty: ', err);
      }

      wallet._bountyOwner = bounty;
      wallet.save(function(err, saved) {
        if (err) {
          return console.err('error updating wallet to user asso: ', err);
        }
        console.log('saved it all');
        res.json(saved);
      });
    });
  });
};