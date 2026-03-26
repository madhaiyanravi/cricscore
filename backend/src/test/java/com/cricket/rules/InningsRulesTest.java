package com.cricket.rules;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

class InningsRulesTest {

    @Test
    void allOutWickets_defaultsToXiWhenUnknown() {
        assertEquals(10, InningsRules.allOutWickets(0));
    }

    @Test
    void allOutWickets_threePlayers_isTwo() {
        assertEquals(2, InningsRules.allOutWickets(3));
    }

    @Test
    void allOutWickets_onePlayer_isZero() {
        assertEquals(0, InningsRules.allOutWickets(1));
    }
}
