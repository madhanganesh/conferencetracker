const _ = require('lodash');
const moment = require('moment');
const Duration = require('./duration');

const MORNING_SLOT_START_TIME = moment({hour: 9});
const MORNING_SLOT_DURATION = Duration.createSlotDuration(180);
const LUNCH_SLOT_START_TIME = MORNING_SLOT_DURATION.addDuration(moment(MORNING_SLOT_START_TIME));
const LUNCH_SLOT_DURATION = Duration.createSlotDuration(60);
const NOON_SLOT_START_TIME = LUNCH_SLOT_DURATION.addDuration(moment(LUNCH_SLOT_START_TIME));
const NOON_SLOT_DURATION = Duration.createSlotDuration(240);

/**
 * A slot abstracts a slot in the track. A track can contain morning, lunch and noon slots
 * Each slot contain the events based on their capacity. The slot maintains its duration state 
 * and updates and events are added to the same.
 */
class Slot {

    constructor(startTime, duration, name='') {
        this._startTime = startTime;
        this._duration = duration;
        this._events = [];
        this._closed = false;
        this._name = name;
    }

    get name() {
        return this._name;
    }

    hasRoomFor(event) {
        return this._duration.canYouAccomodate(event.duration);
    }

    hasRoomLeft() {
        return this._duration.lengthInMinutes >= 5;
    }

    addEvent(event) {
        if (!this.hasRoomFor(event) || this._closed) {
            throw new Error('not enough room to fit this event: ' + event.name);
        }

        this._events.push(event);
        this._duration.reduceLengthBy(event.duration);
    }

    replaceEvent(event, newEvent) {
        const oldEvent = _.find(this._events, e => e._name === event._name);
        if (oldEvent) {
            this._events = _.without(this._events, oldEvent);
            this._duration.addLengthBy(oldEvent.duration);
            this.addEvent(newEvent);
        }
    }

    addNetworkingEvent(event) {
        this._events.push(event);
        this._closed = true;
    }

    get remainingDuration() {
        return this._duration;
    }

    get events() {
        return this._events;
    }

    get schedule() {
        let schedule = {};
        let time = this._startTime;
        this._events.forEach(event => {
            schedule[time.format('hh:mmA')] = event.displayString;
            time = moment(time).add(event._duration.lengthInMinutes, 'minutes');
        });
        return schedule;
    }

    get displayString() {
        const displayString = [];
        const schedule = this.schedule;
        for (const key in schedule) {
            displayString.push(` [${key}-${schedule[key]}] `);
        }
        return displayString.join();
    }

    static new(startTime, lengthInMinutes, name='') {
        return new Slot(startTime, Duration.newDurationForSlot(lengthInMinutes), name);
    }

    static newMorningSlot() {
        // Always make a copy duration
        const duration = Duration.createSlotDuration(MORNING_SLOT_DURATION.lengthInMinutes); 
        return new Slot(MORNING_SLOT_START_TIME, duration, 'Morning Slot');
    }

    static newLunchSlot() {
        const duration = Duration.createSlotDuration(LUNCH_SLOT_DURATION.lengthInMinutes);
        return new Slot(LUNCH_SLOT_START_TIME, duration, 'Lunch Slot');
    }

    static newNoonSlot() {
        const duration = Duration.createSlotDuration(NOON_SLOT_DURATION.lengthInMinutes); 
        return new Slot(NOON_SLOT_START_TIME, duration, 'Noon Slot');
    }
}

module.exports = Slot;
