package com.jiwoo.pincloud;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest(
    properties = {
      "openai.api-key=test-openai-api-key",
      "openai.base-url=https://api.openai.com/v1",
      "openai.model=gpt-4o-mini"
    })
class ApplicationTests {

  @Test
  void contextLoads() {}
}
