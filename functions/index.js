const functions = require("firebase-functions");
const admin = require("firebase-admin")
const PlansTable = "bubbl-plans"
const UsersTable = "bubbl-users"
const ThoughtsTable = "bubbl-thoughts"
const DirectsTable = "direct-messages"

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
    var currServer = info["server"]
    var planVisibility = info["visibility"]

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
    
    var usersChecked = []

    if (planVisibility == "public") {
        console.log("public visibility")
        await db.collection("bubbl-users").where("server","==",currServer).get().then(async querySnap => {

            await querySnap.forEach(async doc=> {
                if (doc.exists && doc.data() != null) {
                    
                    var userId = doc.id
                    var userInfo = await doc.data()
    
                    if (userInfo["username"] != null) {
                        var fcm = userInfo["fcmToken"]
                        if (fcm != null) {
                            usersChecked.push(userInfo["username"])
                            fcmTokens.push(fcm)
                        }
                        
                    }
    
                }
                
            })
    
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
        
            await db.collection("log-plancreate2").add(message)
        
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
    
    
        } else {
            console.log("fcms is null")
            await db.collection("log-plancreate2").add({info: "no fcms"})
        }

    } else {
        //if visibility == selection
        await db.collection("log-plancreate2").add({info: "not public"})
        return
    }

} )

exports.onThoughtUpdated = functions.firestore.document('bubbl-thoughts/{thoughtId}').onUpdate(async (snap,context) => {

    //if likes greater than before let host know
    var beforeData = snap.before.data()
    var afterData = snap.after.data()
    
    var previousLikers = beforeData["likedPeople"]
    var afterLikers = afterData["likedPeople"]
    //var info = await snap.data()
    var thoughtTitle = afterData["title"]
    var thoughtHost = afterData["userId"]
    var hostFcm 

    await db.collection("bubbl-users").doc(thoughtHost).get().then(async res => {
        if (res.exists && res.data() != null) {
            //var userInfoSender = await res.data()

            //var name = await res.data()["name"]
            var fcm = res.data()["fcmToken"]
            
            if (fcm != null) {
                hostFcm = fcm
            }
           

        }

    })

    //var info = await snap.data()
    //var newLiker
    if (beforeData.likedPeople.length < afterData.likedPeople.length) {
        console.log("new like")
        var difference = afterLikers.filter(x=> !previousLikers.includes(x))
        var newLiker = difference[0]
        console.log(`before likers: ${previousLikers}`)
        console.log(`after likers: ${afterLikers}`)
        console.log(difference)
        console.log(newLiker)
        var newLikerName
        //get username of liker
        //get fcm of host
        if (newLiker != null) {
            console.log("newliker not null")
            await db.collection("bubbl-users").doc(newLiker).get().then(async res => {
                if (res.exists && res.data() != null) {
                    var name = await res.data()["name"]
                    newLikerName = name
                }
        
            })
            console.log(newLikerName)
            
        
            //send notifications
            if (hostFcm != null) {

                const message = {
                    data: {info: 'liked-thought'}, 
                    notification: {
                        title: `${newLikerName} liked your thought!`,
                        body: `click to view ${thoughtTitle}`
                    },
                    tokens: [hostFcm]
                }
                
                admin.messaging().sendMulticast(message).then((response)=> {
                    console.log(response.successCount)
                })
            
            }

        }
    }
})

//on thought chat



exports.onThoughtCreated = functions.firestore.document('bubbl-thoughts/{thoughtId}').onCreate(async (snap,context) => {

    var info = await snap.data()
    var currServer = snap.data()["server"]
    var thoughtPeople = info["people"]
    var senderId = info["userId"]

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
            await querySnap.forEach(async doc=> {
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
                
            })
    
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
                        title: `${senderName} created a public thought`,
                        body: "click to view the move"
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
        var receiverNames = []
        await thoughtPeople.forEach(async docId => {
            if (docId != senderId) {
                console.log("after docId not sender check")
                    //var userData = await getUserById(doc.id)
                await db.collection(UsersTable).doc(docId).get().then(snap => {
                    if (snap.exists && snap.data() != null && snap.data()["fcmToken"]!= null) {

                        
                        var fcm = snap.data()["fcmToken"]
                        var name = snap.data()["name"]
                        console.log(`send to ${name}`)
                        receiverNames.push(name)
                        fcmTokens.push(fcm)
                    }
                })

            }
        })
        console.log(receiverNames)


        if (senderName == null ) {
            senderName = "someone"
        }
        if (fcmTokens != null) {
            var message = {
                thoughtTitle: info["title"], 
                thoughtId: context.params.thoughtId,
                fcms: fcmTokens,
                people: receiverNames
            }
            console.log(message)
        
            await db.collection("logging4").add(message)
        
            //send notifications
            if (fcmTokens.length > 0) {
                const message2 = {
                    data: {info: 'thought-created'}, 
                    notification: {
                        title: `${senderName} shared a thought with you`,
                        body: "click to view the move"
                    },
                    tokens: fcmTokens
                }
                admin.messaging().sendMulticast(message2).then((response)=> {
                    console.log(response.successCount)
                })
            
            }
    
    
        }


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
        await docs.forEach(async doc => {
            var subUserInfo = doc.data()
            if (doc.id != senderId && (subUserInfo["status"] == "host" || subUserInfo["status"] == "going")) {
                notificationReceivers.push(doc.id)
                //var userData = await getUserById(doc.id)
                await db.collection(UsersTable).doc(doc.id).get().then(snap => {
                    if (snap.exists && snap.data() != null && snap.data()["username"] != null && snap.data()["fcmToken"]!= null) {
                        var fcm = snap.data()["fcmToken"]
                        fcmList.push(fcm)
                    }
                })
                // if (userData != null && userData["fcmToken"] != null) {
                    
                // }
                

            }
        })
    })

    var chatType
    if (info["text"] != null) {
        chatType = "text"
    } else {
        chatType = "image"
    }

    var message = {
        message: (chatType == "text")? info["text"] : "image sent", 
        planId: context.params.planId,
        senderName: senderName,
        receivers: notificationReceivers,
        plantitle: planTitle,
        fcms: fcmList
    }

    await db.collection("logging").add(message)

    //send notifications
    if (fcmList.length > 0) {
        var messageSent = (chatType == "text")? info["text"] : "sent a picture"
        console.log(messageSent)
        const message = {
            data: {info: 'plan-chat'}, 
            notification: {
                title: `New chat on ${planTitle}`,
                body: `${senderName}: ${messageSent}`
            },
            tokens: fcmList
        }
        admin.messaging().sendMulticast(message).then((response)=> {
            console.log(response.successCount)
        })
    
    }

})

exports.onDirectChat= functions.firestore.document('direct-messages/{directId}/chats/{chatId}').onCreate(async (snap,context)=> {
    var info = snap.data()
    var senderId = info["userId"]
    var senderName = info["name"]
    var directId = context.params.directId
    var directRef = db.collection(DirectsTable).doc(directId)
    var directData = await directRef.get().then(snap => {
        if (snap.exists && snap.data() != null) {
            return snap.data()
        } else {
            return null
        }
        
    })
    var users = directData["users"]
    var receiverId 
    for (let userId of Object.keys(users)) {
        if (userId != senderId) {
            receiverId = userId
        }
    }

    var fcmList = []
    await db.collection(UsersTable).doc(receiverId).get().then(snapshot => {
        if (snapshot.exists && snapshot.data() != null && snapshot.data()["username"] != null && snapshot.data()["fcmToken"]!= null) {
            var fcm = snapshot.data()["fcmToken"]
            var receiver = snapshot.data()["username"]
            fcmList.push(fcm)
            //notificationReceivers.push(receiver)
        }
    })

    if (fcmList.length > 0) {
        //var messageSent = info["text"]
        //console.log(messageSent)
        const message = {
            data: {info: 'direct-chat'}, 
            notification: {
                title: `${senderName} sent you a DM`,
                body: `click to open chat`
            },
            tokens: fcmList
        }
        admin.messaging().sendMulticast(message).then((response)=> {
            console.log(response.successCount)
        })
    
    }

})
    


exports.onThoughtChat= functions.firestore.document('bubbl-thoughts/{thoughtId}/chats/{chatId}').onCreate(async (snap,context)=> {
    var info = snap.data()

    console.log("chat created")
    console.log(info["text"])
    console.log(context.params.thoughtId)
    var senderId = info["userId"]
    var senderName = info["name"]
    var thoughtId = context.params.thoughtId
    //var currentUser = await db.collection()
    //var notificationReceivers = []
    var fcmList = []
    var thoughtRef = db.collection(ThoughtsTable).doc(thoughtId)

    var thoughtData = await thoughtRef.get().then(snap => {
        if (snap.exists && snap.data() != null) {
            return snap.data()
        } else {
            return null
        }
        
    })
    var likers = thoughtData["likedPeople"]
    var thoughtTitle = thoughtData["title"]
    var thoughtHost = thoughtData["userId"]
    console.log(likers)
    
    // const getUserById = async function(userId) {
    //     const userRef = await db.collection(UsersTable).doc(userId)
    //     var content
    //     var info = await userRef.get().then((userInfo)=> {
    //         if (userInfo.exists && userInfo.data() !=null){
    //             content = userInfo.data()
    //         }
            
    
    //     })
    //     return content
    
    // }
    var notificationReceivers = []
    if (!likers.includes(thoughtHost)) {
        likers.push(thoughtHost)
    }

    await likers.forEach(async docId => {
        console.log("inside likers")
        if (docId != senderId) {
            console.log("after id check")
            await db.collection(UsersTable).doc(docId).get().then(snapshot => {
                if (snapshot.exists && snapshot.data() != null && snapshot.data()["username"] != null && snapshot.data()["fcmToken"]!= null) {
                    var fcm = snapshot.data()["fcmToken"]
                    var receiver = snapshot.data()["username"]
                    fcmList.push(fcm)
                    notificationReceivers.push(receiver)
                }
            })

        }
    })
    
    console.log(notificationReceivers)


    var message = {
        message: (info["text"] != null) ? info["text"]: "", 
        thoughtId: context.params.thoughtId,
        senderName: senderName,
        thoughttitle: thoughtTitle,
        fcms: fcmList
    }

    await db.collection("thoughtchatLog").add(message)

    //send notifications
    if (fcmList.length > 0) {
        var messageSent = info["text"]
        console.log(messageSent)
        const message = {
            data: {info: 'thought-chat'}, 
            notification: {
                title: `New chat on liked thought ${thoughtTitle}`,
                body: `${senderName}: ${messageSent}`
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