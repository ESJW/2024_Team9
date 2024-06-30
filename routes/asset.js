const router = require('express').Router();
const setup = require('../db_setup');

let today = new Date();

router.get('/asset', (req, res) =>{
    res.render('asset.ejs');
});

// 잔액 조회
router.get('/asset-money', (req, res) => {
    const uid = req.cookies.uid;
    if (!uid) {
        return res.status(400).send('로그인해주세요');
    }
    profile(req, res);
})

// 입금 처리
router.post('/asset_deposit', async(req, res) => {
    const { mongodb, mysqldb } = await setup();
    const cuid = req.cookies.uid;
    const depositAmount = parseFloat(req.body.depositMoney);

    if (!cuid) {
        return res.status(400).send('로그인해주세요');
    }

    if (isNaN(depositAmount) || depositAmount <= 0) {
        return res.status(400).send('올바른 금액을 입력해주세요');
    }

    // 현재 자산 조회 후 입금 처리
    mongodb.collection('asset')
        .findOneAndUpdate(
            { uid: cuid },
            { $inc: { money: depositAmount } }, // money 필드를 depositAmount만큼 증가
            { returnOriginal: false } 
        )
        .then(result => {
            console.log(result.money);
            if (!result.money) {
                return res.status(404).send('자산 정보를 찾을 수 없습니다.');
            }
            history(req, res);
            res.json({ money: result.money }); // 업데이트된 자산 정보 응답
        })
        .catch(err => {
            console.error('입금 처리 중 오류:', err);
            res.status(500).send('서버 오류');
        });
});

// 출금 처리
router.post('/asset_withdraw', async(req, res) => {
    const { mongodb, mysqldb } = await setup();
    const cuid = req.cookies.uid;
    const withdrawAmount = parseFloat(req.body.withdrawMoney);

    if (!cuid) {
        return res.status(400).send('로그인해주세요');
    }

    if (isNaN(withdrawAmount) || withdrawAmount <= 0) {
        return res.status(400).send('올바른 금액을 입력해주세요');
    }

    // 현재 자산 조회 후 출금 처리
    mongodb.collection('asset')
        .findOneAndUpdate(
            { uid: cuid, money: { $gte: withdrawAmount } }, // 출금 가능 여부 확인
            { $inc: { money: -withdrawAmount } }, // money 필드를 withdrawAmount만큼 감소
            { returnOriginal: false } 
        )
        .then(result => {
            if (!result.money) {
                return res.status(400).send('잔액이 부족합니다.');
            }
            history(req, res);
            res.json({ money: result.money }); // 업데이트된 자산 정보 응답
        })
        .catch(err => {
            console.error('출금 처리 중 오류:', err);
            res.status(500).send('서버 오류');
        });
});

// 입출금 내역 저장 엔드포인트
router.post('/history', async(req, res) => {
    const { mongodb, mysqldb } = await setup();
    const { amount, type, date, userid } = req.body;

    mongodb.collection('assetHistory')
        .insertOne({
            amount,
            type,
            date,
            userid
        })
        .then(() => {
            console.log('입출금 내역이 성공적으로 저장되었습니다.');
            res.status(200).send('입출금 내역이 성공적으로 저장되었습니다.');
        })
        .catch(err => {
            console.error('입출금 내역 저장 중 오류:', err);
            res.status(500).send('입출금 내역 저장 중 오류가 발생했습니다.');
    });
});

// 내역 보기 엔드포인트
router.get('/history', async(req, res) => {
    const { mongodb, mysqldb } = await setup();
    const uid = req.query.userid; // 클라이언트에서 전송한 uid

    if (!uid) {
        return res.status(400).send('유효한 사용자 ID가 제공되지 않았습니다.');
    }

    // uid를 기준으로 내역 조회
    mongodb.collection('assetHistory')
        .find({ userid: uid }, { projection: { _id: 0 } })
        .toArray()
        .then(history => {
            console.log('내역 조회 결과:', history);
            res.json(history); // 조회 결과를 JSON 형식으로 응답
        })
        .catch(err => {
            console.error('내역 조회 중 오류:', err);
            res.status(500).send('내역 조회 중 오류가 발생했습니다.');
        });
});

async function profile(req, res){
    const { mongodb, mysqldb } = await setup();
    const cuid = req.cookies.uid;
    if (!cuid){
        return res.status(400).send('로그인해주세요');
    }
    mongodb.collection('asset')
        .findOne({uid: cuid}, {projection: {money:1, _id:0}})
        .then(result => {
            console.log('server',result);
            res.json({ money: result.money });            
        })
        .catch(err => {
            console.error('데이터 조회 중 오류:', err);
            res.status(500).send('서버 오류');
        });
}

async function history(req, res){
    const { mongodb, mysqldb } = await setup();
    mongodb.collection('assetHistory')
        .insertOne({
            amount: req.body.amount,
            type: req.body.type,
            date: today.toLocaleString(),
            userid: req.body.userid
        })
        .then(()=>{
            console.log('/잔액:',req.body.amount, '/타입:',req.body.type,'/날짜:',req.body.date,'/userid:',req.body.userid);
        });
}

module.exports = router;