const BOT_USER_AGENT = "GoodTogetherLA-ImportBot";

interface RobotsRule {
  userAgent: string;
  disallow: string[];
  allow: string[];
}

function parseRobotsTxt(text: string): RobotsRule[] {
  const rules: RobotsRule[] = [];
  let current: RobotsRule | null = null;

  for (const rawLine of text.split("\n")) {
    const line = rawLine.split("#")[0].trim();
    if (!line) continue;
    const [key, ...rest] = line.split(":");
    const value = rest.join(":").trim();
    const directive = key.trim().toLowerCase();

    if (directive === "user-agent") {
      current = { userAgent: value.toLowerCase(), disallow: [], allow: [] };
      rules.push(current);
    } else if (current && directive === "disallow" && value) {
      current.disallow.push(value);
    } else if (current && directive === "allow" && value) {
      current.allow.push(value);
    }
  }

  return rules;
}

function matches(path: string, rule: string): boolean {
  // robots.txt rules are prefix matches (ignoring the trailing "*" wildcard
  // some sites add); good enough for a pre-flight courtesy check.
  const prefix = rule.replace(/\*$/, "");
  return path.startsWith(prefix);
}

/**
 * Courtesy robots.txt check before scraping a page. Fails open (allows)
 * if robots.txt is missing or unreadable, since its absence doesn't mean
 * "disallow everything" -- but a real deployment should still have a
 * human confirm each site's Terms of Service before enabling its adapter.
 */
export async function isPathAllowed(pageUrl: string): Promise<boolean> {
  const url = new URL(pageUrl);
  const robotsUrl = `${url.origin}/robots.txt`;

  let text: string;
  try {
    const res = await fetch(robotsUrl, {
      headers: { "User-Agent": `${BOT_USER_AGENT}/1.0` },
    });
    if (!res.ok) return true;
    text = await res.text();
  } catch {
    return true;
  }

  const rules = parseRobotsTxt(text);
  const ourRules = rules.filter(
    (r) => r.userAgent === BOT_USER_AGENT.toLowerCase()
  );
  const wildcardRules = rules.filter((r) => r.userAgent === "*");
  const applicable = ourRules.length > 0 ? ourRules : wildcardRules;

  for (const rule of applicable) {
    if (rule.disallow.some((d) => matches(url.pathname, d))) {
      if (rule.allow.some((a) => matches(url.pathname, a))) continue;
      return false;
    }
  }

  return true;
}

export { BOT_USER_AGENT };
