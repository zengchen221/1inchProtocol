const { BN, ether, expectRevert } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');
const assert = require('assert');
const truffleAssert = require('truffle-assertions');
const {AddressZero, MaxUint256} = require("ethers/constants");

const MockERC20 = artifacts.require("MockERC20");
const OneSplitView = artifacts.require('OneSplitView');
const OneSplitViewWrap = artifacts.require('OneSplitViewWrap');
const OneSplit = artifacts.require('OneSplit');
const OneSplitWrap = artifacts.require('OneSplitWrap');
const OneSplitAudit = artifacts.require('OneSplitAudit')
// const IMooniswapRegistry = artifacts.require('IMooniswapRegistry');
// const IMooniswap = artifacts.require('IMooniswap');

const DISABLE_ALL = new BN('20000000', 16).add(new BN('40000000', 16));
const CURVE_SYNTHETIX = new BN('40000', 16);
const CURVE_COMPOUND = new BN('1000', 16);
const CURVE_ALL = new BN('200000000000', 16);
const KYBER_ALL = new BN('200000000000000', 16);
const MOONISWAP_ALL = new BN('8000000000000000', 16);
const BALANCER_ALL = new BN('1000000000000', 16);
const UNISWAP_V2 = new BN('2000000', 16);

contract('Trader', function ([_, addr1]) {
    describe('Trader', async function () {
        before(async function () {

            const subSplitView = await OneSplitView.new();
            const splitView = await OneSplitViewWrap.new(subSplitView.address);
            const subSplit = await OneSplit.new(splitView.address);
            // this.split = await OneSplitWrap.new(splitView.address, subSplit.address);
            const splitWrap = await OneSplitWrap.new(splitView.address, subSplit.address);
            this.split = await OneSplitAudit.new(splitWrap.address)
            // this.split = await OneSplitAudit.at("0xC586BeF4a0992C495Cf22e1aeEE4E446CECDee0E") 

            console.log("split  address: ",this.split.address)
            console.log("user   address: ",addr1)
        });


        it('should return same input (DAI to bDAI)', async function () {
            const inputAmount = '84';

            const res = await this.split.getExpectedReturn(
                '0x6B175474E89094C44Da98b954EedeAC495271d0F', // DAI
                '0x6a4FFAafa8DD400676Df8076AD6c724867b0e2e8', // bDAI
                web3.utils.toWei(inputAmount),
                10,
                0,
            );

            const returnAmount = web3.utils.fromWei(res.returnAmount.toString(), 'ether');

            assert.strictEqual(
                returnAmount,
                inputAmount,
                'Invalid swap ratio',
            );

            console.log(`input: ${inputAmount} DAI`);
            console.log(`returnAmount: ${returnAmount} bDAI`);
            console.log('distribution:', res.distribution.map(a => a.toString()));

            console.log('raw:', res.returnAmount.toString());
        });



        it('split: eth -> token', async function () {

            const fromToken = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE' // eth
            const toToken   = '0x6B175474E89094C44Da98b954EedeAC495271d0F' // DAI
            const swapAmount = '1000000000000000000'     // 1.0
            const forwardFlags = 0
            const backwardFlags = 0

            const erc20Token = await MockERC20.at(toToken)

            const forwardRes = await this.split.getExpectedReturn(
                fromToken, 
                toToken, 
                swapAmount, 
                1,
                forwardFlags,
                {from: addr1}
            );

            console.log('forward swap getExpectedReturn: ');
            console.log('        returnAmount:', forwardRes.returnAmount.toString() / 1e18 );
            console.log('        distribution:', forwardRes.distribution.map(a => a.toString()));


            const backRes = await this.split.getExpectedReturn(
                toToken, 
                fromToken, 
                forwardRes.returnAmount, 
                1,
                backwardFlags,
                {from: addr1}
            );

            console.log('backward swap getExpectedReturn: ');
            console.log('         returnAmount:', backRes.returnAmount.toString() / 1e18 );
            console.log('         distribution:', backRes.distribution.map(a => a.toString()));

            await this.split.swap(
                fromToken, 
                toToken,
                swapAmount,
                0,
                forwardRes.distribution,
                forwardFlags,
                {value:swapAmount, from: addr1}
            )
            const aliceBalance3 = await web3.eth.getBalance(addr1);
            console.log(`addr: ${aliceBalance3}`);


            let addrTokenAmount = await erc20Token.balanceOf(addr1);
            console.log("token  amount ", addrTokenAmount.toString())
            await erc20Token.approve(this.split.address, MaxUint256 ,{from: addr1})
            let addrAmount = await erc20Token.allowance(addr1, this.split.address);
            console.log("approve amount ", addrAmount.toString())


            await this.split.swap(
                toToken,
                fromToken, 
                addrTokenAmount,
                0,
                backRes.distribution,
                backwardFlags,
                {from: addr1}
            )

            const aliceBalance4 = await web3.eth.getBalance(addr1);
            console.log(`addr: ${aliceBalance4}`);

        });
    });
});