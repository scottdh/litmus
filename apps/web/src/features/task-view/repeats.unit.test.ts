import { describe, expect, it } from 'vitest';
import { excerpt, findRepeat, repeatWords } from './repeats';

const item = (id: string, text: string) => ({ id, text });

describe('repeatWords', () => {
  it('keeps lower-case words longer than two letters', () => {
    expect(repeatWords('Brake PADS go on a shelf')).toEqual(['brak', 'pad', 'shelf']);
  });

  it('leaves out common stopwords', () => {
    expect(repeatWords('They said that this was really about the wheels')).toEqual(['wheel']);
  });

  it('strips endings like -s, -es, -ed and -ing, so forms of a word match', () => {
    expect(repeatWords('boxes waited waiting refunds')).toEqual(['box', 'wait', 'refund']);
    expect(repeatWords('freezes')).toEqual(repeatWords('freeze'));
    expect(repeatWords('notes')).toEqual(repeatWords('note'));
    expect(repeatWords('making')).toEqual(repeatWords('make'));
  });

  it("doesn't strip a double s, or cut a word below three letters", () => {
    expect(repeatWords('process processes')).toEqual(['process']);
    expect(repeatWords('used')).toEqual(['used']);
  });

  it('reads curly and straight apostrophes as part of a word', () => {
    expect(repeatWords('the mechanic’s bench isn’t clear')).toEqual(['mechanic', 'bench', 'clear']);
    expect(repeatWords("the mechanic's bench")).toEqual(['mechanic', 'bench']);
  });

  it('counts each word once', () => {
    expect(repeatWords('wheel wheels wheel')).toEqual(['wheel']);
  });
});

describe('findRepeat', () => {
  const pains = [
    item('pain_1', 'The till freezes when a refund goes through'),
    item('pain_2', 'Parts arrive without a label'),
  ];

  it('finds what a draft overlaps in the same list', () => {
    expect(findRepeat('Refunds freeze the till', pains)).toEqual(pains[0]);
  });

  it('finds nothing when the words differ', () => {
    expect(findRepeat('Customers wait outside for collection', pains)).toBeNull();
  });

  it('needs at least three words written', () => {
    expect(findRepeat('till freezes', pains)).toBeNull();
    expect(findRepeat('the till, it freezes', pains)).toBeNull();
    expect(findRepeat('till freezes on refunds', pains)).toEqual(pains[0]);
  });

  it('needs at least two words shared', () => {
    const one = [item('pain_9', 'Labels')];
    expect(findRepeat('labels everywhere, labels gone missing', one)).toBeNull();
  });

  it('scores shared words over the shorter text, and matches from 0.4', () => {
    const others = [item('idea_1', 'alpha bravo charlie delta echo')];
    // 2 shared of 5: 0.4.
    expect(findRepeat('alpha bravo foxtrot golf hotel', others)).toEqual(others[0]);
    // 2 shared of 6 in the shorter text: 0.33.
    expect(
      findRepeat('alpha bravo foxtrot golf hotel india', [item('idea_2', 'alpha bravo charlie delta echo kilo')]),
    ).toBeNull();
  });

  it('picks the closest when several overlap', () => {
    const others = [item('a', 'wheel truing takes ages every spring'), item('b', 'wheel truing takes ages')];
    expect(findRepeat('wheel truing takes ages before races', others)).toEqual(others[1]);
  });

  it('skips the item being edited', () => {
    expect(findRepeat('The till freezes when a refund goes through', pains, 'pain_1')).toBeNull();
  });
});

describe('excerpt', () => {
  it('keeps a short text whole', () => {
    expect(excerpt('Parts arrive without a label')).toBe('Parts arrive without a label');
  });

  it('cuts a long text at a word, with an ellipsis', () => {
    const long = 'one two three four five six seven eight nine ten eleven twelve thirteen fourteen';
    expect(excerpt(long)).toBe('one two three four five six seven eight nine ten eleven twelve…');
  });
});
