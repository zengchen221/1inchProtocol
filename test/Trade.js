const { BN, ether, expectRevert } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');
const assert = require('assert');
// const truffleAssert = require('truffle-assertions');
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
// const UNISWAP_V2 = new BN('2000000', 16);
const SAKE_ALL = new BN("1000000000000000000", 16);
const OASIS = new BN("8", 16);
const BANCOR = new BN("4", 16);
const DFORCE_SWAP =    new BN('4000000000', 16);
const SHELL =  new BN('8000000000', 16);
const DMM =    new BN('80000000000', 16);
const MSTABLE_MUSD = new BN('20000000000', 16);
const UNISWAP_ALL  = new BN('100000000000', 16);


contract('Trade', function ([_, addr1]) {
    describe('Trade', async function () {
        before(async function () {

            const oneSplitView = await OneSplitView.new();
            const oneSplitViewWrap = await OneSplitViewWrap.new(oneSplitView.address);
            const oneSplit = await OneSplit.new(oneSplitViewWrap.address);
            const oneSplitWrap = await OneSplitWrap.new(oneSplitViewWrap.address, oneSplit.address);
            this.split = await OneSplitAudit.new(oneSplitWrap.address)
            // this.split = await OneSplitAudit2.at("0x50FDA034C0Ce7a8f7EFDAebDA7Aa7cA21CC1267e") 

            console.log("split  address: ",this.split.address)
            console.log("user   address: ",addr1)
        });



        // it('should work with ETH => COMP', async function () {
        //     const res = await this.split.getExpectedReturn(
        //         '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE', // ETH
        //         '0xc00e94Cb662C3520282E6f5717214004A7f26888', // USDC
        //         '1000000000000000000', // 1.0
        //         1,
        //         0,
        //     );

        //     console.log('Swap: 1 ETH');
        //     console.log('returnAmount:', res.returnAmount.toString() / 1e18 + ' COMP');
        //     // console.log('distribution:', res.distribution.map(a => a.toString()));
        //     // console.log('raw:', res.returnAmount.toString());
        //     expect(res.returnAmount).to.be.bignumber.above('390000000');
        // });


        it('split: eth -> token', async function () {
            const fromToken = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE' // eth
            const toToken   = '0x514910771af9ca656af840dff83e8264ecf986ca' // Link
            const swapAmount = '1000000000000000000'     // 1.0
            const forwardFlags = DMM  
            const backwardFlags = DMM

            //DISABLE_ALL.add(UNISWAP_V2).add(CURVE_ALL).add(KYBER_ALL).add(SAKE_ALL).add(BALANCER_ALL).add(MOONISWAP_ALL).add(OASIS).add(BANCOR).add(DFORCE_SWAP).add(SHELL).add(DMM) 

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


            const aliceBalance0 = await web3.eth.getBalance(addr1);
            console.log(`before swap, user eth balance: ${aliceBalance0}`);

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
            console.log(`forward swap done, user eth balance:  ${aliceBalance3}`);


            let addrTokenAmount = await erc20Token.balanceOf(addr1);
            console.log("forward swap done, user erc20 balance:  ", addrTokenAmount.toString())
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
            console.log(`backward swap done, user eth balance: ${aliceBalance4}`);
            let addrTokenAmount2 = await erc20Token.balanceOf(addr1);
            console.log("backward swap done, user erc20 balance: ", addrTokenAmount2.toString())

        });
    });
});
