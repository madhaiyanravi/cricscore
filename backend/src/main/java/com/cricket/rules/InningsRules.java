package com.cricket.rules;

public final class InningsRules {

    private InningsRules() {}

    /**
     * Returns the wicket count at which an innings is considered all out.
     * <p>
     * Standard cricket: total players = 11, all out wickets = 10.
     */
    public static int allOutWickets(int totalPlayers) {
        int players = totalPlayers > 0 ? totalPlayers : 11;
        return Math.max(0, players - 1);
    }
}
