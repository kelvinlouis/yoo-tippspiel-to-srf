const API = 'https://wm18-yoo.azurewebsites.net/api/matches/';
const GROUP_PHASE_END = '2018-06-28T18:00:00Z';
const initPoints = () => ({ points: 0, winner: 0, diff: 0, home: 0, away: 0 });

function getWinner(home, away) {
    if (home === away) return 0;
    if (home > away) return 1;
    return 2;
}

function calculatePoints(home, away, uHome, uAway, date) {
    if (uHome === null || uAway === null) return initPoints();

    const then = +new Date(date);
    const groupEndDate = +new Date(GROUP_PHASE_END);

    if (then <= groupEndDate) {
        return calculateGroupPhasePoints(home, away, uHome, uAway);
    } else {
        return calculateKOPhasePoints(home, away, uHome, uAway);
    }
}

function calculateGroupPhasePoints(home, away, uHome, uAway) {
    const diff = home - away;
    const uDiff = uHome - uAway;
    const winner = getWinner(home, away);
    const uWinner = getWinner(uHome, uAway);
    let points = 0;
    const categories = { winner: 0, diff: 0, home: 0, away: 0 };

    if (winner === uWinner) {
        points += 5;
        categories.winner = 1;
    }
    if (home === uHome) {
        points += 1;
        categories.home = 1;
    }
    if (away === uAway) {
        points += 1;
        categories.away = 1;
    }
    if (diff === uDiff) {
        points += 3;
        categories.diff = 1;
    }

    return Object.assign(categories, { points });
}

function calculateKOPhasePoints(home, away, uHome, uAway) {
    const calculated = calculateGroupPhasePoints(home, away, uHome, uAway);
    calculated.points = calculated.points * 2;

    return calculated;
}

export default class Service {
    constructor() {
        this.bets = null;
    }

    getBets() {
        if (this.bets === null) {
            return fetch(API)
                .then(res => res.json())
                .then(json => this.bets = json);
        } else {
            return Promise.resolve(this.bets);
        }
    }

    getCompletedMatches() {
        return this.bets.filter(b => b.MatchCompleted === true);
    }

    getUsers() {
        return this.bets[0].Tips.map(t => t.User);
    }

    getPointsMap() {
        const points = new Map();

        // Initialize points
        this.getUsers().forEach(u => points.set(u, initPoints()));

        // Create complete points map
        this.getCompletedMatches().forEach((m) => {
            const home = m.HomeGoals;
            const away = m.AwayGoals;
            const date = m.Date;

            m.Tips.forEach((t) => {
                const user = t.User;
                const uHome = t.HomeGoals;
                const uAway = t.AwayGoals;

                const currentPoints = points.get(user);
                const newPoints = calculatePoints(home, away, uHome, uAway, date);

                points.set(user, {
                    points: currentPoints.points + newPoints.points,
                    winner: currentPoints.winner + newPoints.winner,
                    diff: currentPoints.diff + newPoints.diff,
                    home: currentPoints.home + newPoints.home,
                    away: currentPoints.away + newPoints.away,
                });
            });
        });

        return points;
    }

    getRanking() {
        return new Promise((resolve) => {
            this.getBets().then(() => {
                // Expect to have bets
                const pointsMap = this.getPointsMap();
                const ranking = [];

                pointsMap.forEach((p, user) => {
                    ranking.push(Object.assign(p, { user }));
                });

                const sortedRanking = ranking.sort((a, b) => {
                    if (a.points > b.points) {
                        return -1;
                    } else if (a.points < b.points) {
                        return 1;
                    } else {
                        return 0;
                    }
                });

                let rank = 1;
                let prevPoints = sortedRanking[0].points;

                resolve(sortedRanking.map((r) => {
                    if (r.points < prevPoints) {
                        rank++;
                    }
                    prevPoints = r.points;

                    return Object.assign({ rank }, r);
                }));
            });
        });
    }
}