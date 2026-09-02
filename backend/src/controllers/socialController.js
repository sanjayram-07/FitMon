const { admin, getDb } = require('../firebase/admin');

/**
 * Firestore layout (Strava-style):
 *   users/{uid}                         — profile + followersCount/followingCount
 *   users/{uid}/following/{targetUid}    — { uid: targetUid, name, photoURL, followedAt }
 *   users/{uid}/followers/{followerUid}  — { uid: followerUid, name, photoURL, followedAt }
 *
 * Both sides are written together so followers/following lists never need a
 * cross-collection join — only the profile snapshot embedded at follow time
 * can go stale, which is an acceptable tradeoff for a small social graph.
 */

function publicProfileFields(data = {}) {
  return {
    name: data.name || 'FitMon Athlete',
    email: data.email || '',
    photoURL: data.photoURL || '',
    goal: data.goal || '',
    followersCount: data.followersCount || 0,
    followingCount: data.followingCount || 0,
    totalSessions: data.totalSessions || 0,
    badges: data.badges || [],
  };
}

async function followUser(req, res) {
  const targetUid = req.params.uid;
  const myUid = req.user.uid;

  if (targetUid === myUid) {
    return res.status(400).json({ message: 'You cannot follow yourself.' });
  }

  try {
    const db = getDb();
    const myRef = db.collection('users').doc(myUid);
    const targetRef = db.collection('users').doc(targetUid);
    const [mySnap, targetSnap] = await Promise.all([myRef.get(), targetRef.get()]);

    if (!targetSnap.exists) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const followingRef = myRef.collection('following').doc(targetUid);
    const alreadyFollowing = (await followingRef.get()).exists;
    if (alreadyFollowing) {
      return res.json({ following: true });
    }

    const followerRef = targetRef.collection('followers').doc(myUid);
    const batch = db.batch();
    const now = admin.firestore.FieldValue.serverTimestamp();

    batch.set(followingRef, {
      uid: targetUid,
      name: targetSnap.data().name || '',
      photoURL: targetSnap.data().photoURL || '',
      followedAt: now,
    });
    batch.set(followerRef, {
      uid: myUid,
      name: mySnap.exists ? mySnap.data().name || '' : '',
      photoURL: mySnap.exists ? mySnap.data().photoURL || '' : '',
      followedAt: now,
    });
    batch.set(myRef, { followingCount: admin.firestore.FieldValue.increment(1) }, { merge: true });
    batch.set(targetRef, { followersCount: admin.firestore.FieldValue.increment(1) }, { merge: true });

    await batch.commit();
    res.json({ following: true });
  } catch (error) {
    res.status(500).json({ message: 'Failed to follow user', details: error.message });
  }
}

async function unfollowUser(req, res) {
  const targetUid = req.params.uid;
  const myUid = req.user.uid;

  try {
    const db = getDb();
    const myRef = db.collection('users').doc(myUid);
    const targetRef = db.collection('users').doc(targetUid);
    const followingRef = myRef.collection('following').doc(targetUid);
    const followerRef = targetRef.collection('followers').doc(myUid);

    const wasFollowing = (await followingRef.get()).exists;
    if (!wasFollowing) {
      return res.json({ following: false });
    }

    const batch = db.batch();
    batch.delete(followingRef);
    batch.delete(followerRef);
    batch.set(myRef, { followingCount: admin.firestore.FieldValue.increment(-1) }, { merge: true });
    batch.set(targetRef, { followersCount: admin.firestore.FieldValue.increment(-1) }, { merge: true });

    await batch.commit();
    res.json({ following: false });
  } catch (error) {
    res.status(500).json({ message: 'Failed to unfollow user', details: error.message });
  }
}

async function listFollowers(req, res) {
  try {
    const db = getDb();
    const snap = await db.collection('users').doc(req.params.uid).collection('followers').get();
    const followers = snap.docs.map((doc) => doc.data());
    res.json({ followers });
  } catch (error) {
    res.status(500).json({ message: 'Failed to load followers', details: error.message });
  }
}

async function listFollowing(req, res) {
  try {
    const db = getDb();
    const snap = await db.collection('users').doc(req.params.uid).collection('following').get();
    const following = snap.docs.map((doc) => doc.data());
    res.json({ following });
  } catch (error) {
    res.status(500).json({ message: 'Failed to load following', details: error.message });
  }
}

/** GET /api/social/people?q=search — browse/search athletes to follow. */
async function listPeople(req, res) {
  try {
    const db = getDb();
    const q = (req.query.q || '').toLowerCase().trim();
    const [usersSnap, followingSnap] = await Promise.all([
      db.collection('users').limit(200).get(),
      db.collection('users').doc(req.user.uid).collection('following').get(),
    ]);

    const followingIds = new Set(followingSnap.docs.map((doc) => doc.id));

    const people = usersSnap.docs
      .filter((doc) => doc.id !== req.user.uid)
      .map((doc) => ({ uid: doc.id, ...publicProfileFields(doc.data()), isFollowing: followingIds.has(doc.id) }))
      .filter((person) => !q || person.name.toLowerCase().includes(q) || person.email.toLowerCase().includes(q));

    res.json({ people });
  } catch (error) {
    res.status(500).json({ message: 'Failed to load people', details: error.message });
  }
}

/** GET /api/social/feed — recent sessions from people the caller follows, Strava-style. */
async function getFollowingFeed(req, res) {
  try {
    const db = getDb();
    const followingSnap = await db.collection('users').doc(req.user.uid).collection('following').get();
    const followingIds = followingSnap.docs.map((doc) => doc.id);

    if (!followingIds.length) {
      return res.json({ activities: [] });
    }

    // Firestore 'in' queries cap at 30 values — chunk if the graph ever grows past that.
    const chunks = [];
    for (let i = 0; i < followingIds.length; i += 30) chunks.push(followingIds.slice(i, i + 30));

    const snaps = await Promise.all(
      chunks.map((chunk) => db.collection('sessions').where('uid', 'in', chunk).get()),
    );

    const activities = [];
    snaps.forEach((snap) => {
      snap.forEach((doc) => {
        const data = doc.data();
        const followerMeta = followingSnap.docs.find((d) => d.id === data.uid)?.data();
        activities.push({
          id: doc.id,
          uid: data.uid,
          name: followerMeta?.name || data.email || 'FitMon athlete',
          exercise: data.exercise,
          totalReps: data.totalReps,
          avgPostureScore: data.avgPostureScore,
          startedAt: data.startedAt,
          endedAt: data.endedAt,
          createdAt: data.createdAt,
        });
      });
    });

    activities.sort((a, b) => (b.startedAt || 0) - (a.startedAt || 0));
    res.json({ activities: activities.slice(0, 40) });
  } catch (error) {
    res.status(500).json({ message: 'Failed to load following feed', details: error.message });
  }
}

/** GET /api/social/users/:uid — public profile card for another athlete. */
async function getPublicProfile(req, res) {
  try {
    const db = getDb();
    const targetUid = req.params.uid;
    const [targetSnap, followingSnap] = await Promise.all([
      db.collection('users').doc(targetUid).get(),
      db.collection('users').doc(req.user.uid).collection('following').doc(targetUid).get(),
    ]);

    if (!targetSnap.exists) {
      return res.status(404).json({ message: 'User not found.' });
    }

    res.json({
      uid: targetUid,
      ...publicProfileFields(targetSnap.data()),
      isFollowing: followingSnap.exists,
      isSelf: targetUid === req.user.uid,
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to load profile', details: error.message });
  }
}

module.exports = {
  followUser,
  unfollowUser,
  listFollowers,
  listFollowing,
  listPeople,
  getFollowingFeed,
  getPublicProfile,
};
