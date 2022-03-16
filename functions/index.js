const functions = require("firebase-functions");
const admin = require("firebase-admin")
const PlansTable = "bubbl-plans"
const UsersTable = "bubbl-users"

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
// exports.helloWorld = functions.https.onRequest((request, response) => {
//   functions.logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });


admin.initializeApp()
const db = admin.firestore()

//send notification to

// exports.testPlan = functions.firestore.document('bubbl-plan-test/{planId}').onCreate(async (snap,context) => {

//     console.log("testOncreate")
//     db.collection("logs").add({value:"chinada" })

// })
//on public thought created send notification
//on public plan created send notification

//on Person likes thought sent notification to host

//on person chats in thought send notification to likers


exports.onPlanCreated = functions.firestore.document('bubbl-plans/{planId}').onCreate(async (snap,context) => {


    //if 
    var info = await snap.data()
    var currServer = snap.data()["server"]
    var planVisibility = snap.data()["visibilty"]

    var fcmTokens = []
    var senderName

    await db.collection("bubbl-users").doc(info["host"]).get().then(async res => {
        if (res.exists && res.data() != null) {
            var userInfoSender = await res.data()

            var name = await res.data()["name"]
            senderName = name

        }

    })
    
    //if visibility == public

    if (planVisibility == "public") {
        await db.collection("bubbl-users").where("server","==",currServer).get().then(async querySnap => {

            await Promise.all(querySnap.doc.map(async doc=> {
                if (doc.exists && doc.data() != null) {
                    var userId = doc.id
                    var userInfo = await doc.data()
    
                if (userInfo["username"] != null) {
                    var fcm = userInfo["fcmToken"]
                    if (fcm != null) {
                        fcmTokens.push(fcm)
                    }
                    
                }
    
                }
                
            }))
    
        })

        if (senderName == null ) {
            senderName = "someone"
        }
        if (fcmTokens != null) {
            var message = {
                data: info["title"], 
                planId: context.params.planId,
                fcms: fcmTokens
            }
        
            await db.collection("log-plancreate").add(message)
        
            //send notifications
            if (fcmTokens.length > 0) {
                const message2 = {
                    data: {info: 'plan-created'}, 
                    notification: {
                        title: `${senderName} shared a public plan`,
                        body: "click to view"
                    },
                    tokens: fcmTokens
                }
                admin.messaging().sendMulticast(message2).then((response)=> {
                    console.log(response.successCount)
                })
            
            }
    
    
        }

    } else {
        //if visibility == selection
        return
    }

} )



exports.onThoughtCreated = functions.firestore.document('bubbl-thoughts/{thoughtId}').onCreate(async (snap,context) => {

    var info = await snap.data()
    var currServer = snap.data()["server"]

    var thoughtVisibility = snap.data()["visibility"]

    var fcmTokens = []
    var senderName

    await db.collection("bubbl-users").doc(info["userId"]).get().then(async res => {
        if (res.exists && res.data() != null) {
            var userInfoSender = await res.data()

            var name = await res.data()["name"]
            senderName = name

        }

    })

    
    if (thoughtVisibility == "public") {
        await db.collection("bubbl-users").where("server","==",currServer).get().then(async querySnap => {


            await Promise.all(querySnap.docs.map(async doc  => {
                if (doc.exists && doc.data() != null) {
                    var userId = doc.id
                    var userInfo = await doc.data()
    
                    if (userInfo["username"] != null ) {
    
    
                        
                        var fcm = userInfo["fcmToken"]
                        if (fcm != null) {
                            fcmTokens.push(fcm)
                        }
                        
                    }
    
                }
                
            }))
    
        })
        if (senderName == null ) {
            senderName = "someone"
        }
        if (fcmTokens != null) {
            var message = {
                data: info["title"], 
                thoughtId: context.params.thoughtId,
                fcms: fcmTokens
            }
        
            await db.collection("logging3").add(message)
        
            //send notifications
            if (fcmTokens.length > 0) {
                const message2 = {
                    data: {info: 'thought-created'}, 
                    notification: {
                        title: `${senderName} created a thought`,
                        body: "click to view the move",
                        sound: "default"
                    },
                    tokens: fcmTokens
                }
                admin.messaging().sendMulticast(message2).then((response)=> {
                    console.log(response.successCount)
                })
            
            }
    
    
        }

    } else {
        //selection
        return
    }
    


} )

exports.onPersonDown = functions.firestore.document('bubbl-plans/{planId}/bubbl-users/{userId}').onCreate(async (snap, context)=> {
    var info = snap.data()
    var personId = snap.id
    var personName = snap.data()["name"]
    var planId = context.params.planId
    var hostId
    var planTitle = ""
    await db.collection("bubbl-plans").doc(planId).get().then(snap => {
        if (snap.exists && snap.data()!=null) {
            hostId = snap.data()["host"]
            planTitle = snap.data()["title"]
        }
    })

    var fcm

    if (hostId != null && personId != hostId) {
        await db.collection("bubbl-users").doc(hostId).get().then(async res => {
            fcm = res.data()["fcmToken"]

            var message = {
                data: info["name"], 
                planId: context.params.planId,
                fcms: fcm
            }
        
            await db.collection("logging2").add(message)
        
            //send notifications
            if (fcm != null) {
                const message = {
                    data: {info: 'down-to-plan'}, 
                    notification: {
                        title: `${info["name"]} is down for ${planTitle}`,
                        body: "click to view plan"
                    },
                    tokens: [fcm]
                }
                admin.messaging().sendMulticast(message).then((response)=> {
                    console.log(response.successCount)
                })
            
            }
        })


    }


})



exports.onChatCreated = functions.firestore.document('bubbl-plans/{planId}/chats/{chatId}').onCreate(async (snap,context)=> {
    var info = snap.data()

    console.log("chat created")
    console.log(info["text"])
    console.log(context.params.planId)
    var senderId = info["userId"]
    var senderName = info["name"]
    var planId = context.params.planId
    //var currentUser = await db.collection()
    var notificationReceivers = []
    var fcmList = []
    var planRef = db.collection(PlansTable).doc(planId)
    
    var planTitle
    const getUserById = async function(userId) {
        const userRef = await db.collection(UsersTable).doc(userId)
        var content
        var info = await userRef.get().then((userInfo)=> {
            if (userInfo.exists && userInfo.data() !=null){
                content = userInfo.data()
            }
            
    
        })
        return content
    
    }

    await planRef.get().then(snap =>{
        if (snap.exists && snap.data() != null) {
            planTitle = snap.data()["title"]

        }
        
    })

    await planRef.collection(UsersTable).get().then(async (docs) => {
        await Promise.all(docs.map(async doc => {
            var subUserInfo = doc.data()
            if (doc.id != senderId && (subUserInfo["status"] == "host" || subUserInfo["status"] == "going")) {
                notificationReceivers.push(doc.id)
                //var userData = await getUserById(doc.id)
                await db.collection(UsersTable).doc(doc.id).get().then(snap => {
                    if (snap.exists && snap.data() !=null && snap.data()["fcmToken"]!= null) {
                        var fcm = snap.data()["fcmToken"]
                        fcmList.push(fcm)
                    }
                })
                // if (userData != null && userData["fcmToken"] != null) {
                    
                // }
                

            }
        }));
    })
    
    


    var message = {
        data: info["text"], 
        planId: context.params.planId,
        senderName: senderName,
        receivers: notificationReceivers,
        plantitle: planTitle,
        fcms: fcmList
    }

    await db.collection("logging").add(message)

    //send notifications
    if (fcmList.length > 0) {
        const message = {
            data: {info: 'plan-chat'}, 
            notification: {
                title: `${senderName} sent a chat to ${planTitle}`,
                body: "click to view chat"
            },
            tokens: fcmList
        }
        admin.messaging().sendMulticast(message).then((response)=> {
            console.log(response.successCount)
        })
    
    }

})


//when friends sub doc created is that someone sent first friend req (started relation)
//when doc is updated is that it is edited

//exports.onFriendRequest = functions.firestore.document('friends/{userId}/friends-sub/{otherUserId}').